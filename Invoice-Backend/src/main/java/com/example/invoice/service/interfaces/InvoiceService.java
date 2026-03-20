package com.example.invoice.service.interfaces;

import com.example.invoice.dto.request.InvoiceRequest;
import com.example.invoice.dto.response.InvoiceResponse;
import com.example.invoice.dto.response.PageResponse;

public interface InvoiceService
{
    InvoiceResponse create(InvoiceRequest request);
    InvoiceResponse getById(Long id);
    InvoiceResponse getByInvoiceNumber(String invoiceNumber);
    PageResponse<InvoiceResponse> getAll(int page, int size);
    PageResponse<InvoiceResponse> getByCustomer(Long customerId, int page, int size);
    PageResponse<InvoiceResponse> getByDateRange(String from, String to, int page, int size);
    void cancel(Long id);
}
