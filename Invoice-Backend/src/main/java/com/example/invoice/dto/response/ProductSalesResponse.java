package com.example.invoice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSalesResponse
{
    private Long productId;
    private String productName;
    private String categoryName;
    private Long totalQuantitySold;
    private BigDecimal totalRevenue;
}
