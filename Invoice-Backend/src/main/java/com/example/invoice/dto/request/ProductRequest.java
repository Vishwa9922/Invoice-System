package com.example.invoice.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductRequest
{
    @NotBlank(message = "Product name is required")
    @Size(max = 150)
    private String name;

    @Size(max = 255)
    private String description;

    @NotBlank(message = "SKU is required")
    @Size(max = 50)
    private String sku;

    @Size(max = 50)
    private String barcode;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal price;

    @DecimalMin(value = "0.0")
    @DecimalMax(value = "100.0")
    @Digits(integer = 3, fraction = 2)
    private BigDecimal taxPercent = BigDecimal.ZERO;

    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stock = 0;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private Boolean active = true;
}
