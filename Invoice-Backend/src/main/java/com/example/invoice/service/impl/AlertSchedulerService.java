package com.example.invoice.service.impl;

import com.example.invoice.domain.Product;
import com.example.invoice.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertSchedulerService
{
    private final ProductRepository productRepository;

    // Runs every day at 8:00 AM
    @Scheduled(cron = "0 0 8 * * *")
    public void runDailyAlerts() {
        checkLowStock();
        checkExpiringProducts();
    }

    private void checkLowStock() {
        List<Product> products = productRepository
                .findByActiveTrue(PageRequest.of(0, Integer.MAX_VALUE))
                .getContent();

        List<Product> lowStock = products.stream()
                .filter(p -> p.getStock() <= p.getLowStockThreshold()
                        && p.getStock() > 0)
                .toList();

        List<Product> outOfStock = products.stream()
                .filter(p -> p.getStock() == 0)
                .toList();

        if (!lowStock.isEmpty()) {
            log.warn("LOW STOCK ALERT — {} products below threshold:", lowStock.size());
            lowStock.forEach(p ->
                    log.warn("  → {} | Stock: {} | Threshold: {}",
                            p.getName(), p.getStock(), p.getLowStockThreshold()));
        }

        if (!outOfStock.isEmpty()) {
            log.warn("OUT OF STOCK ALERT — {} products:", outOfStock.size());
            outOfStock.forEach(p -> log.warn("  → {}", p.getName()));
        }
    }

    private void checkExpiringProducts() {
        LocalDate today  = LocalDate.now();
        LocalDate in30   = today.plusDays(30);

        List<Product> expiringSoon = productRepository
                .findByActiveTrue(PageRequest.of(0, Integer.MAX_VALUE))
                .getContent().stream()
                .filter(p -> p.getExpiryDate() != null
                        && p.getExpiryDate().isAfter(today)
                        && p.getExpiryDate().isBefore(in30))
                .toList();

        List<Product> expired = productRepository
                .findByActiveTrue(PageRequest.of(0, Integer.MAX_VALUE))
                .getContent().stream()
                .filter(p -> p.getExpiryDate() != null
                        && p.getExpiryDate().isBefore(today))
                .toList();

        if (!expiringSoon.isEmpty()) {
            log.warn("EXPIRY ALERT — {} products expiring in 30 days:", expiringSoon.size());
            expiringSoon.forEach(p ->
                    log.warn("  → {} | Expires: {}", p.getName(), p.getExpiryDate()));
        }

        if (!expired.isEmpty()) {
            log.warn("EXPIRED PRODUCTS — {} products already expired:", expired.size());
            expired.forEach(p ->
                    log.warn("  → {} | Expired: {}", p.getName(), p.getExpiryDate()));
        }
    }
}
