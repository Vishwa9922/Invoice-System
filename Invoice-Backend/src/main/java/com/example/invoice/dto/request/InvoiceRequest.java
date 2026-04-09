package com.example.invoice.dto.request;

import com.example.invoice.domain.enums.PaymentMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class InvoiceRequest
{
    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<InvoiceItemRequest> items;

    @NotNull(message = "Payment mode is required")
    private PaymentMode paymentMode;

    private BigDecimal discount = BigDecimal.ZERO;

    private String notes;

    private byte[] signatureImage;
}
