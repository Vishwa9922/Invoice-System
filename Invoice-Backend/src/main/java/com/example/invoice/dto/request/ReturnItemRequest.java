package com.example.invoice.dto.request;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class ReturnItemRequest
{
    @NotNull private Long productId;
    @NotNull @Min(1) private Integer quantity;
}
