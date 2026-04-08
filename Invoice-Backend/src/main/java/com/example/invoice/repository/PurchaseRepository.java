package com.example.invoice.repository;

import com.example.invoice.domain.Purchase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    Page<Purchase> findByCancelledFalse(Pageable pageable);

    Page<Purchase> findBySupplierIdAndCancelledFalse(
            Long supplierId, Pageable pageable);

    Page<Purchase> findByCancelledFalseAndCreatedAtBetween(
            LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<Purchase> findBySupplierIdAndCancelledFalseAndCreatedAtBetween(
            Long supplierId, LocalDateTime from, LocalDateTime to,
            Pageable pageable);
}