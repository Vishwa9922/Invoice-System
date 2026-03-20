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
public class DashboardSummaryResponse
{
    private BigDecimal todayRevenue;
    private BigDecimal monthRevenue;
    private Long todayInvoiceCount;
    private Long monthInvoiceCount;
    private Long totalProducts;
    private Long totalCustomers;
    private Long lowStockCount;  // products with stock < 10
}
