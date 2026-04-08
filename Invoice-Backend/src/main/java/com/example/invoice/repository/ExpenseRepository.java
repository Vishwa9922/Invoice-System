package com.example.invoice.repository;

import com.example.invoice.domain.Expense;
import com.example.invoice.domain.enums.ExpenseCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long>
{
    @Query("SELECT e FROM Expense e WHERE " +
            "(:category IS NULL OR e.category = :category) AND " +
            "(:from IS NULL OR e.date >= :from) AND " +
            "(:to IS NULL OR e.date <= :to)")
    Page<Expense> findWithFilters(
            @Param("category") ExpenseCategory category,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
            "WHERE e.date BETWEEN :from AND :to")
    BigDecimal sumByDateRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    List<Expense> findByDateBetween(LocalDate from, LocalDate to);
}
