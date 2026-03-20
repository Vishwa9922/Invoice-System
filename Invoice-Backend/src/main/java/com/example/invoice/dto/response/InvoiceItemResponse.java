package com.example.invoice.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class InvoiceItemResponse
{
    private Long id;
    private Long productId;
    private String productName;
    private BigDecimal unitPrice;
    private BigDecimal taxPercent;
    private Integer quantity;
    private BigDecimal lineTotal;
    private BigDecimal lineTax;
}
