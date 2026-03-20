package com.example.invoice.repository;

import com.example.invoice.domain.InvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, Long>
{
    List<InvoiceItem> findByInvoiceId(Long invoiceId);

    // Product-wise sales report
    @Query("SELECT ii.product.id, ii.productName, " +
            "SUM(ii.quantity) as totalQty, SUM(ii.lineTotal) as totalRevenue " +
            "FROM InvoiceItem ii " +
            "JOIN ii.invoice inv " +
            "WHERE inv.createdAt BETWEEN :from AND :to " +
            "AND inv.status = 'PAID' " +
            "GROUP BY ii.product.id, ii.productName " +
            "ORDER BY totalRevenue DESC")
    List<Object[]> findProductSalesReport(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // Category-wise sales report
    @Query("SELECT ii.product.category.id, ii.product.category.name, " +
            "SUM(ii.quantity) as totalQty, SUM(ii.lineTotal) as totalRevenue " +
            "FROM InvoiceItem ii " +
            "JOIN ii.invoice inv " +
            "WHERE inv.createdAt BETWEEN :from AND :to " +
            "AND inv.status = 'PAID' " +
            "GROUP BY ii.product.category.id, ii.product.category.name " +
            "ORDER BY totalRevenue DESC")
    List<Object[]> findCategorySalesReport(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // Top selling products
    @Query("SELECT ii.product.id, ii.productName, SUM(ii.quantity) as totalQty " +
            "FROM InvoiceItem ii JOIN ii.invoice inv " +
            "WHERE inv.status = 'PAID' " +
            "GROUP BY ii.product.id, ii.productName " +
            "ORDER BY totalQty DESC LIMIT :limit")
    List<Object[]> findTopSellingProducts(@Param("limit") int limit);
}
