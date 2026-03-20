package com.example.invoice.service.impl;

import com.example.invoice.domain.enums.InvoiceStatus;
import com.example.invoice.dto.response.DashboardSummaryResponse;
import com.example.invoice.dto.response.ProductSalesResponse;
import com.example.invoice.dto.response.SalesReportResponse;
import com.example.invoice.repository.CustomerRepository;
import com.example.invoice.repository.InvoiceItemRepository;
import com.example.invoice.repository.InvoiceRepository;
import com.example.invoice.repository.ProductRepository;
import com.example.invoice.service.interfaces.ReportService;
import com.example.invoice.util.Constants;
import com.example.invoice.util.DateUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService
{
    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    @Override
    public DashboardSummaryResponse getDashboardSummary() {
        LocalDateTime todayStart = DateUtils.startOfToday();
        LocalDateTime todayEnd   = DateUtils.endOfToday();
        LocalDate now            = LocalDate.now();
        LocalDateTime monthStart = DateUtils.startOfMonth(now);
        LocalDateTime monthEnd   = DateUtils.endOfMonth(now);

        BigDecimal todayRevenue  = invoiceRepository.sumRevenueByDateRange(todayStart, todayEnd);
        BigDecimal monthRevenue  = invoiceRepository.sumRevenueByDateRange(monthStart, monthEnd);
        Long todayCount          = invoiceRepository.countByDateRange(todayStart, todayEnd);
        Long monthCount          = invoiceRepository.countByDateRange(monthStart, monthEnd);
        Long totalProducts       = productRepository.count();
        Long totalCustomers      = customerRepository.count();
        Long lowStock            = productRepository.findByActiveTrue(
                        org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE))
                .stream()
                .filter(p -> p.getStock() < Constants.LOW_STOCK_THRESHOLD)
                .count();

        return DashboardSummaryResponse.builder()
                .todayRevenue(todayRevenue)
                .monthRevenue(monthRevenue)
                .todayInvoiceCount(todayCount)
                .monthInvoiceCount(monthCount)
                .totalProducts(totalProducts)
                .totalCustomers(totalCustomers)
                .lowStockCount(lowStock)
                .build();
    }

    @Override
    public List<SalesReportResponse> getSalesReport(String from, String to) {
        LocalDateTime fromDt = DateUtils.startOfDay(LocalDate.parse(from));
        LocalDateTime toDt   = DateUtils.endOfDay(LocalDate.parse(to));

        return invoiceRepository
                .findByCreatedAtBetweenAndStatus(fromDt, toDt, InvoiceStatus.PAID)
                .stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        inv -> inv.getCreatedAt().toLocalDate()))
                .entrySet().stream()
                .map(entry -> {
                    var invoices = entry.getValue();
                    BigDecimal revenue  = invoices.stream().map(i -> i.getGrandTotal())
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal tax      = invoices.stream().map(i -> i.getTotalTax())
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal discount = invoices.stream().map(i -> i.getDiscount())
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return SalesReportResponse.builder()
                            .date(entry.getKey())
                            .invoiceCount((long) invoices.size())
                            .totalRevenue(revenue)
                            .totalTax(tax)
                            .totalDiscount(discount)
                            .build();
                })
                .sorted(java.util.Comparator.comparing(SalesReportResponse::getDate))
                .toList();
    }

    @Override
    public List<ProductSalesResponse> getProductSalesReport(String from, String to) {
        LocalDateTime fromDt = DateUtils.startOfDay(LocalDate.parse(from));
        LocalDateTime toDt   = DateUtils.endOfDay(LocalDate.parse(to));

        List<Object[]> rows = invoiceItemRepository.findProductSalesReport(fromDt, toDt);
        return mapToProductSalesResponse(rows);
    }

    @Override
    public List<ProductSalesResponse> getCategorySalesReport(String from, String to) {
        LocalDateTime fromDt = DateUtils.startOfDay(LocalDate.parse(from));
        LocalDateTime toDt   = DateUtils.endOfDay(LocalDate.parse(to));

        List<Object[]> rows = invoiceItemRepository.findCategorySalesReport(fromDt, toDt);
        return mapToProductSalesResponse(rows);
    }

    @Override
    public List<ProductSalesResponse> getTopSellingProducts(int limit) {
        int safeLimit = limit > 0 ? limit : Constants.TOP_PRODUCTS_LIMIT;
        List<Object[]> rows = invoiceItemRepository.findTopSellingProducts(safeLimit);
        List<ProductSalesResponse> result = new ArrayList<>();
        for (Object[] row : rows) {
            result.add(ProductSalesResponse.builder()
                    .productId(((Number) row[0]).longValue())
                    .productName((String) row[1])
                    .totalQuantitySold(((Number) row[2]).longValue())
                    .totalRevenue(BigDecimal.ZERO) // not in top query, can extend
                    .build());
        }
        return result;
    }

    private List<ProductSalesResponse> mapToProductSalesResponse(List<Object[]> rows) {
        List<ProductSalesResponse> result = new ArrayList<>();
        for (Object[] row : rows) {
            result.add(ProductSalesResponse.builder()
                    .productId(((Number) row[0]).longValue())
                    .productName((String) row[1])
                    .totalQuantitySold(((Number) row[2]).longValue())
                    .totalRevenue((BigDecimal) row[3])
                    .build());
        }
        return result;
    }
}
