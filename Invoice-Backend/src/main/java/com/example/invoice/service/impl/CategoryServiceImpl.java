package com.example.invoice.service.impl;

import com.example.invoice.domain.Category;
import com.example.invoice.dto.request.CategoryRequest;
import com.example.invoice.dto.response.CategoryResponse;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.exception.DuplicateResourceException;
import com.example.invoice.exception.ResourceNotFoundException;
import com.example.invoice.mapper.CategoryMapper;
import com.example.invoice.repository.CategoryRepository;
import com.example.invoice.service.interfaces.CategoryService;
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
public class CategoryServiceImpl implements CategoryService
{
    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    @Override
    public CategoryResponse create(CategoryRequest request) {
        log.info("Creating category: {}", request.getName());
        if (categoryRepository.existsByNameIgnoreCase(request.getName())) {
            throw new DuplicateResourceException(
                    "Category already exists with name: " + request.getName());
        }
        Category category = categoryMapper.toEntity(request);
        Category saved = categoryRepository.save(category);
        log.info("Category created with id: {}", saved.getId());
        return categoryMapper.toResponse(saved);
    }

    @Override
    public CategoryResponse update(Long id, CategoryRequest request) {
        log.info("Updating category id: {}", id);
        Category category = findCategoryById(id);
        // Check duplicate only if name is changing
        if (!category.getName().equalsIgnoreCase(request.getName()) &&
                categoryRepository.existsByNameIgnoreCase(request.getName())) {
            throw new DuplicateResourceException(
                    "Category already exists with name: " + request.getName());
        }
        categoryMapper.updateEntity(request, category);
        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getById(Long id) {
        return categoryMapper.toResponse(findCategoryById(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CategoryResponse> getAll(int page, int size) {
        Page<Category> result = categoryRepository.findAll(PageRequest.of(page, size));
        return buildPageResponse(result);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllActive() {
        return categoryRepository.findByActiveTrue()
                .stream()
                .map(categoryMapper::toResponse)
                .toList();
    }

    @Override
    public void delete(Long id) {
        log.info("Deleting category id: {}", id);
        Category category = findCategoryById(id);
        category.setActive(false); // soft delete
        categoryRepository.save(category);
    }

    private Category findCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
    }

    private PageResponse<CategoryResponse> buildPageResponse(Page<Category> page) {
        return PageResponse.<CategoryResponse>builder()
                .content(page.getContent().stream().map(categoryMapper::toResponse).toList())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
