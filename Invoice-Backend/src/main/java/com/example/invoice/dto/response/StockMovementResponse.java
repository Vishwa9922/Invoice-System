package com.example.invoice.dto.response;

import com.example.invoice.domain.enums.StockMovementType;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class StockMovementResponse
{
    private Long id;
    private Long productId;
    private String productName;
    private StockMovementType movementType;
    private Integer quantityChanged;
    private Integer stockBefore;
    private Integer stockAfter;
    private Long referenceId;
    private String note;
    private String createdBy;
    private LocalDateTime createdAt;
}
