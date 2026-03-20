package com.example.invoice.service.interfaces;

public interface ExportService
{
    byte[] exportSalesReportToExcel(String from, String to);
    byte[] exportSalesReportToCsv(String from, String to);
}
