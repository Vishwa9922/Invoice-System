package com.example.invoice.service.interfaces;

public interface PdfService
{
    byte[] generateInvoicePdf(Long invoiceId);
}
