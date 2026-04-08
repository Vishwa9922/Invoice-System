package com.example.invoice.service.interfaces;

import com.example.invoice.dto.request.PaymentRequest;
import com.example.invoice.dto.response.PaymentResponse;

import java.util.List;

public interface PaymentService
{
    PaymentResponse recordPayment(PaymentRequest request);
    List<PaymentResponse> getByInvoice(Long invoiceId);
    List<Object> getPendingDues();
    String generateWhatsAppReminder(Long invoiceId);
}
