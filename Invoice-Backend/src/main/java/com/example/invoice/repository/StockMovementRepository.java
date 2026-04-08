package com.example.invoice.repository;

import com.example.invoice.domain.StockMovement;
import com.example.invoice.domain.enums.StockMovementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long>
{
    List<StockMovement> findByProductIdOrderByCreatedAtDesc(Long productId);

    Page<StockMovement> findByProductId(Long productId, Pageable pageable);

    Page<StockMovement> findByProductIdAndMovementType(
            Long productId, StockMovementType type, Pageable pageable);

    Page<StockMovement> findByProductIdAndCreatedAtBetween(
            Long productId, LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<StockMovement> findByProductIdAndMovementTypeAndCreatedAtBetween(
            Long productId, StockMovementType type,
            LocalDateTime from, LocalDateTime to, Pageable pageable);

    List<StockMovement> findByProductIdAndCreatedAtBetweenOrderByCreatedAt(
            Long productId, LocalDateTime from, LocalDateTime to);

    // For graph data
    @Query("SELECT sm FROM StockMovement sm WHERE sm.product.id = :productId " +
            "AND sm.createdAt BETWEEN :from AND :to ORDER BY sm.createdAt ASC")
    List<StockMovement> findForGraph(
            @Param("productId") Long productId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
