package com.example.invoice.repository;

import com.example.invoice.domain.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long>
{
    @Query("SELECT s FROM Supplier s WHERE s.active = true AND " +
            "(:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%',:search,'%')) " +
            "OR s.phone LIKE CONCAT('%',:search,'%'))")
    Page<Supplier> searchSuppliers(@Param("search") String search, Pageable pageable);

    Page<Supplier> findByActiveTrue(Pageable pageable);
}
