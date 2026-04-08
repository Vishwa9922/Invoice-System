package com.example.invoice.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class PurchaseItemResponse
{
    private Long id;
    private Long productId;
    private String productName;
    private Integer quantity;
    private BigDecimal purchasePrice;
    private BigDecimal lineTotal;
}
