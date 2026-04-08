package com.example.invoice.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ReturnItemResponse
{
    private Long id;
    private Long productId;
    private String productName;
    private Integer quantity;
    private BigDecimal refundAmount;
}
