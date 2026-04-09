package com.example.invoice.dto.request;

import com.example.invoice.domain.enums.PaymentMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class PosRequest
{
    // Customer details — mobile is mandatory, name is optional
    @NotNull(message = "Mobile number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter valid 10-digit mobile number")
    private String mobileNumber;

    private String customerName;  // auto-fill if existing customer

    @NotEmpty(message = "Cart cannot be empty")
    @Valid
    private List<InvoiceItemRequest> items;

    @NotNull(message = "Payment mode is required")
    private PaymentMode paymentMode;

    private BigDecimal discount = BigDecimal.ZERO;

    private String notes;

    private String signatureBase64;

}
