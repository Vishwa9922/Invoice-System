package com.example.invoice.dto.response;

import com.example.invoice.domain.enums.PaymentMode;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PurchaseResponse
{
    private Long id;
    private Long supplierId;
    private String supplierName;
    private List<PurchaseItemResponse> items;
    private BigDecimal totalAmount;
    private PaymentMode paymentMode;
    private String note;
    private LocalDate purchaseDate;
    private Boolean cancelled;
    private LocalDateTime createdAt;
}
