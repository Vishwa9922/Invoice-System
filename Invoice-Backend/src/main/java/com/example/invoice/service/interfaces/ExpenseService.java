package com.example.invoice.service.interfaces;

import com.example.invoice.dto.request.ExpenseRequest;
import com.example.invoice.dto.response.ExpenseResponse;
import com.example.invoice.dto.response.PageResponse;

public interface ExpenseService
{
    ExpenseResponse create(ExpenseRequest request);
    ExpenseResponse update(Long id, ExpenseRequest request);
    ExpenseResponse getById(Long id);
    PageResponse<ExpenseResponse> getAll(String category, String from, String to, int page, int size);
    void delete(Long id);
}
