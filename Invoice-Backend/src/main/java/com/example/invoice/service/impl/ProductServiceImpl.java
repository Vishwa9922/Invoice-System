package com.example.invoice.service.impl;

import com.example.invoice.domain.Category;
import com.example.invoice.domain.Product;
import com.example.invoice.dto.request.ProductRequest;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.dto.response.ProductResponse;
import com.example.invoice.exception.DuplicateResourceException;
import com.example.invoice.exception.ResourceNotFoundException;
import com.example.invoice.mapper.ProductMapper;
import com.example.invoice.repository.CategoryRepository;
import com.example.invoice.repository.ProductRepository;
import com.example.invoice.service.interfaces.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProductServiceImpl implements ProductService
{
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;

    @Override
    public ProductResponse create(ProductRequest request) {
        log.info("Creating product: {}", request.getName());
        if (productRepository.existsBySku(request.getSku())) {
            throw new DuplicateResourceException("Product already exists with SKU: " + request.getSku());
        }
        if (request.getBarcode() != null && productRepository.existsByBarcode(request.getBarcode())) {
            throw new DuplicateResourceException("Product already exists with barcode: " + request.getBarcode());
        }
        Category category = findCategoryById(request.getCategoryId());
        Product product = productMapper.toEntity(request);
        product.setCategory(category);
        return productMapper.toResponse(productRepository.save(product));
    }

    @Override
    public ProductResponse update(Long id, ProductRequest request) {
        log.info("Updating product id: {}", id);
        Product product = findProductById(id);
        if (!product.getSku().equals(request.getSku()) &&
                productRepository.existsBySku(request.getSku())) {
            throw new DuplicateResourceException("SKU already exists: " + request.getSku());
        }
        Category category = findCategoryById(request.getCategoryId());
        productMapper.updateEntity(request, product);
        product.setCategory(category);
        return productMapper.toResponse(productRepository.save(product));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        return productMapper.toResponse(findProductById(id));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getByBarcode(String barcode) {
        Product product = productRepository.findByBarcode(barcode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Product not found with barcode: " + barcode));
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getAll(int page, int size) {
        Page<Product> result = productRepository.findByActiveTrue(PageRequest.of(page, size));
        return buildPageResponse(result);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> search(String keyword, int page, int size) {
        Page<Product> result = productRepository.searchProducts(keyword, PageRequest.of(page, size));
        return buildPageResponse(result);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getByCategory(Long categoryId, int page, int size) {
        List<Product> products = productRepository.findByCategoryIdAndActiveTrue(categoryId);
        // wrap in PageResponse manually for simplicity
        return PageResponse.<ProductResponse>builder()
                .content(products.stream().map(productMapper::toResponse).toList())
                .pageNumber(0)
                .pageSize(products.size())
                .totalElements(products.size())
                .totalPages(1)
                .last(true)
                .build();
    }

    @Override
    public void delete(Long id) {
        Product product = findProductById(id);
        product.setActive(false);
        productRepository.save(product);
        log.info("Product soft-deleted id: {}", id);
    }

    @Override
    public void updateStock(Long productId, int quantityToDeduct) {
        Product product = findProductById(productId);
        int newStock = product.getStock() - quantityToDeduct;
        if (newStock < 0) newStock = 0;
        product.setStock(newStock);
        productRepository.save(product);
    }

    private Product findProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    private Category findCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
    }

    private PageResponse<ProductResponse> buildPageResponse(Page<Product> page) {
        return PageResponse.<ProductResponse>builder()
                .content(page.getContent().stream().map(productMapper::toResponse).toList())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
