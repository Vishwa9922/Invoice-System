package com.example.invoice.service.interfaces;

import com.example.invoice.dto.request.PurchaseRequest;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.dto.response.PurchaseResponse;

public interface PurchaseService
{
    PurchaseResponse create(PurchaseRequest request);
    PurchaseResponse getById(Long id);
    PageResponse<PurchaseResponse> getAll(Long supplierId, String from, String to, int page, int size);
    void cancel(Long id);
}
