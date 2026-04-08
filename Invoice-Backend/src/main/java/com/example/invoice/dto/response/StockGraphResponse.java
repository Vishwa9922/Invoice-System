package com.example.invoice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class StockGraphResponse
{
    private LocalDateTime date;
    private Integer stockLevel;
    private String movementType;
}
