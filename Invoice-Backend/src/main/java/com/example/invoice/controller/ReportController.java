package com.example.invoice.controller;

import com.example.invoice.dto.response.ApiResponse;
import com.example.invoice.dto.response.DashboardSummaryResponse;
import com.example.invoice.dto.response.ProductSalesResponse;
import com.example.invoice.dto.response.SalesReportResponse;
import com.example.invoice.service.interfaces.ExportService;
import com.example.invoice.service.interfaces.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Sales and analytics report APIs")
public class ReportController
{
    private final ReportService reportService;
    private final ExportService exportService;

    @GetMapping("/dashboard")
    @Operation(summary = "Dashboard summary — today revenue, month revenue, counts")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getDashboardSummary()));
    }

    @GetMapping("/sales")
    @Operation(summary = "Daily sales report for a date range — ?from=2024-01-01&to=2024-01-31")
    public ResponseEntity<ApiResponse<List<SalesReportResponse>>> getSalesReport(
            @RequestParam String from,
            @RequestParam String to) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getSalesReport(from, to)));
    }

    @GetMapping("/products")
    @Operation(summary = "Product-wise sales report")
    public ResponseEntity<ApiResponse<List<ProductSalesResponse>>> getProductSales(
            @RequestParam String from,
            @RequestParam String to) {
        return ResponseEntity.ok(
                ApiResponse.success(reportService.getProductSalesReport(from, to)));
    }

    @GetMapping("/categories")
    @Operation(summary = "Category-wise sales report")
    public ResponseEntity<ApiResponse<List<ProductSalesResponse>>> getCategorySales(
            @RequestParam String from,
            @RequestParam String to) {
        return ResponseEntity.ok(
                ApiResponse.success(reportService.getCategorySalesReport(from, to)));
    }

    @GetMapping("/top-products")
    @Operation(summary = "Top selling products — ?limit=10")
    public ResponseEntity<ApiResponse<List<ProductSalesResponse>>> getTopProducts(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(
                ApiResponse.success(reportService.getTopSellingProducts(limit)));
    }

    @GetMapping("/export/excel")
    @Operation(summary = "Export sales report to Excel (.xlsx)")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam String from,
            @RequestParam String to) {
        byte[] data = exportService.exportSalesReportToExcel(from, to);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment",
                "sales-report-" + from + "-to-" + to + ".xlsx");
        return ResponseEntity.ok().headers(headers).body(data);
    }

    @GetMapping("/export/csv")
    @Operation(summary = "Export sales report to CSV")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam String from,
            @RequestParam String to) {
        byte[] data = exportService.exportSalesReportToCsv(from, to);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment",
                "sales-report-" + from + "-to-" + to + ".csv");
        return ResponseEntity.ok().headers(headers).body(data);
    }
}
