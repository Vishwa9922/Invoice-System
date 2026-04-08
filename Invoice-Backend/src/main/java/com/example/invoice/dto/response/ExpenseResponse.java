package com.example.invoice.dto.response;

import com.example.invoice.domain.enums.ExpenseCategory;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ExpenseResponse
{
    private Long id;
    private String title;
    private ExpenseCategory category;
    private BigDecimal amount;
    private LocalDate date;
    private String note;
    private LocalDateTime createdAt;
}
