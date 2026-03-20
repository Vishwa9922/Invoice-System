package com.example.invoice.repository;

import com.example.invoice.domain.Invoice;
import com.example.invoice.domain.enums.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long>
{
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    Page<Invoice> findByCustomerId(Long customerId, Pageable pageable);

    Page<Invoice> findByCreatedAtBetween(
            LocalDateTime from, LocalDateTime to, Pageable pageable);

    List<Invoice> findByCreatedAtBetweenAndStatus(
            LocalDateTime from, LocalDateTime to, InvoiceStatus status);

    @Query("SELECT COALESCE(SUM(i.grandTotal), 0) FROM Invoice i " +
            "WHERE i.createdAt BETWEEN :from AND :to AND i.status = 'PAID'")
    BigDecimal sumRevenueByDateRange(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(i) FROM Invoice i " +
            "WHERE i.createdAt BETWEEN :from AND :to")
    Long countByDateRange(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    // For invoice number generation — get the latest invoice number
    @Query("SELECT i.invoiceNumber FROM Invoice i ORDER BY i.id DESC LIMIT 1")
    Optional<String> findLastInvoiceNumber();
}
