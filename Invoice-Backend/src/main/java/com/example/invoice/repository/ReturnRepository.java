package com.example.invoice.repository;

import com.example.invoice.domain.Return;
import com.example.invoice.domain.enums.ReturnStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface ReturnRepository extends JpaRepository<Return, Long> {

    // Sirf status filter
    Page<Return> findByStatus(ReturnStatus status, Pageable pageable);

    // Sirf date range filter
    Page<Return> findByCreatedAtBetween(
            LocalDateTime from, LocalDateTime to, Pageable pageable);

    // Status + date range dono
    Page<Return> findByStatusAndCreatedAtBetween(
            ReturnStatus status,
            LocalDateTime from, LocalDateTime to,
            Pageable pageable);
}