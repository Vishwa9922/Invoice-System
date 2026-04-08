package com.example.invoice.dto.response;

import com.example.invoice.domain.enums.PaymentMode;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentResponse
{
    private Long id;
    private Long invoiceId;
    private String invoiceNumber;
    private BigDecimal amount;
    private PaymentMode paymentMode;
    private String note;
    private LocalDateTime createdAt;
}
