package com.example.invoice.service.interfaces;

import com.example.invoice.dto.request.SupplierRequest;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.dto.response.SupplierResponse;

public interface SupplierService
{
    SupplierResponse create(SupplierRequest request);
    SupplierResponse update(Long id, SupplierRequest request);
    SupplierResponse getById(Long id);
    PageResponse<SupplierResponse> getAll(int page, int size, String search);
    void delete(Long id);
}
