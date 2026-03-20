package com.example.invoice.service.impl;

import com.example.invoice.dto.response.SalesReportResponse;
import com.example.invoice.service.interfaces.ExportService;
import com.example.invoice.service.interfaces.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExportServiceImpl implements ExportService
{
    private final ReportService reportService;

    @Override
    public byte[] exportSalesReportToExcel(String from, String to) {
        List<SalesReportResponse> data = reportService.getSalesReport(from, to);

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Sales Report");

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Header row
            String[] columns = {"Date", "Invoice Count", "Total Revenue", "Total Tax", "Total Discount"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowNum = 1;
            for (SalesReportResponse r : data) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(r.getDate().toString());
                row.createCell(1).setCellValue(r.getInvoiceCount());
                row.createCell(2).setCellValue(r.getTotalRevenue().doubleValue());
                row.createCell(3).setCellValue(r.getTotalTax().doubleValue());
                row.createCell(4).setCellValue(r.getTotalDiscount().doubleValue());
            }

            // Auto-size columns
            for (int i = 0; i < columns.length; i++) sheet.autoSizeColumn(i);

            workbook.write(out);
            log.info("Excel export complete. Rows: {}", data.size());
            return out.toByteArray();

        } catch (Exception e) {
            log.error("Excel export failed", e);
            throw new RuntimeException("Failed to export Excel", e);
        }
    }

    @Override
    public byte[] exportSalesReportToCsv(String from, String to) {
        List<SalesReportResponse> data = reportService.getSalesReport(from, to);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             PrintWriter writer = new PrintWriter(out)) {

            writer.println("Date,Invoice Count,Total Revenue,Total Tax,Total Discount");
            for (SalesReportResponse r : data) {
                writer.printf("%s,%d,%.2f,%.2f,%.2f%n",
                        r.getDate(), r.getInvoiceCount(),
                        r.getTotalRevenue(), r.getTotalTax(), r.getTotalDiscount());
            }
            writer.flush();
            log.info("CSV export complete. Rows: {}", data.size());
            return out.toByteArray();

        } catch (Exception e) {
            log.error("CSV export failed", e);
            throw new RuntimeException("Failed to export CSV", e);
        }
    }
}
