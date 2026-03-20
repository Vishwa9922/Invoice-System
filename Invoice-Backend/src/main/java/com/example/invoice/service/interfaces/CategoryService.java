package com.example.invoice.service.interfaces;

import com.example.invoice.dto.request.CategoryRequest;
import com.example.invoice.dto.response.CategoryResponse;
import com.example.invoice.dto.response.PageResponse;

import java.util.List;

public interface CategoryService
{
    CategoryResponse create(CategoryRequest request);
    CategoryResponse update(Long id, CategoryRequest request);
    CategoryResponse getById(Long id);
    PageResponse<CategoryResponse> getAll(int page, int size);
    List<CategoryResponse> getAllActive();
    void delete(Long id);
}
