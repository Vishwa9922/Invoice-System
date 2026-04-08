package com.example.invoice.dto.request;

import com.example.invoice.domain.enums.ExpenseCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ExpenseRequest
{
    @NotBlank private String title;
    @NotNull  private ExpenseCategory category;
    @NotNull  private BigDecimal amount;
    @NotNull  private LocalDate date;
    private String note;
}
