package com.example.invoice.dto.request;

import com.example.invoice.domain.enums.StockMovementType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StockAdjustRequest
{
    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Quantity is required")
    private Integer quantity; // positive or negative

    @NotNull(message = "Movement type is required")
    private StockMovementType movementType; // MANUAL, DAMAGE, CORRECTION

    private String note;
    private String adjustedBy;
}
