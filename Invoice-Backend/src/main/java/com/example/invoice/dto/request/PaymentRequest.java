package com.example.invoice.dto.request;

import com.example.invoice.domain.enums.PaymentMode;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class PaymentRequest
{
    @NotNull private Long invoiceId;
    @NotNull private BigDecimal amount;
    @NotNull private PaymentMode paymentMode;
    private String note;
}
