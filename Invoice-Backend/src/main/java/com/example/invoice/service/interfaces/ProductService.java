package com.example.invoice.service.interfaces;

import com.example.invoice.dto.request.ProductRequest;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.dto.response.ProductResponse;

public interface ProductService
{
    ProductResponse create(ProductRequest request);
    ProductResponse update(Long id, ProductRequest request);
    ProductResponse getById(Long id);
    ProductResponse getByBarcode(String barcode);
    PageResponse<ProductResponse> getAll(int page, int size);
    PageResponse<ProductResponse> search(String keyword, int page, int size);
    PageResponse<ProductResponse> getByCategory(Long categoryId, int page, int size);
    void delete(Long id);
    void updateStock(Long productId, int quantity); // deduct stock after sale
}
