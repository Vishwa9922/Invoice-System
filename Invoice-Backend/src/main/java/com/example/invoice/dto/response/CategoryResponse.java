package com.example.invoice.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CategoryResponse
{
    private Long id;
    private String name;
    private String description;
    private Boolean active;
    private LocalDateTime createdAt;
}
