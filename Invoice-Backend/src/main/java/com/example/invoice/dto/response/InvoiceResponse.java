package com.example.invoice.dto.response;

import com.example.invoice.domain.enums.InvoiceStatus;
import com.example.invoice.domain.enums.PaymentMode;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class InvoiceResponse
{
    private Long id;
    private String invoiceNumber;
    private CustomerResponse customer;
    private List<InvoiceItemResponse> items;
    private BigDecimal subtotal;
    private BigDecimal totalTax;
    private BigDecimal discount;
    private BigDecimal grandTotal;
    private PaymentMode paymentMode;
    private InvoiceStatus status;
    private String notes;
    private LocalDateTime createdAt;
}
