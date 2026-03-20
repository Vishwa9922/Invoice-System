package com.example.invoice.service.interfaces;

import com.example.invoice.dto.request.PosRequest;
import com.example.invoice.dto.response.InvoiceResponse;

public interface PosService
{
    // Single entry point for POS billing
    InvoiceResponse checkout(PosRequest request);
}
