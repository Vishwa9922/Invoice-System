package com.example.invoice.service.interfaces;

import com.example.invoice.dto.response.DashboardSummaryResponse;
import com.example.invoice.dto.response.ProductSalesResponse;
import com.example.invoice.dto.response.SalesReportResponse;

import java.util.List;

public interface ReportService
{
    DashboardSummaryResponse getDashboardSummary();
    List<SalesReportResponse> getSalesReport(String from, String to);
    List<ProductSalesResponse> getProductSalesReport(String from, String to);
    List<ProductSalesResponse> getCategorySalesReport(String from, String to);
    List<ProductSalesResponse> getTopSellingProducts(int limit);
}
