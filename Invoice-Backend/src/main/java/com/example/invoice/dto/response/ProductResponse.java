package com.example.invoice.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ProductResponse
{
    private Long id;
    private String name;
    private String description;
    private String sku;
    private String barcode;
    private BigDecimal price;
    private BigDecimal taxPercent;
    private Integer stock;
    private Boolean active;
    private Long categoryId;
    private String categoryName;
    private LocalDateTime createdAt;
}
