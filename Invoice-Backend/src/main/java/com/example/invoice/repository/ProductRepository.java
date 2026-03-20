package com.example.invoice.repository;

import com.example.invoice.domain.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>
{
    Optional<Product> findBySku(String sku);
    Optional<Product> findByBarcode(String barcode);
    boolean existsBySku(String sku);
    boolean existsByBarcode(String barcode);
    List<Product> findByCategoryIdAndActiveTrue(Long categoryId);
    Page<Product> findByActiveTrue(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.active = true AND " +
            "(LOWER(p.name) LIKE LOWER(CONCAT('%',:keyword,'%')) OR " +
            "LOWER(p.sku) LIKE LOWER(CONCAT('%',:keyword,'%')) OR " +
            "p.barcode LIKE CONCAT('%',:keyword,'%'))")
    Page<Product> searchProducts(@Param("keyword") String keyword, Pageable pageable);
}
