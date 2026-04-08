package com.example.invoice.controller;

import com.example.invoice.dto.response.ApiResponse;
import com.example.invoice.dto.response.ProductResponse;
import com.example.invoice.repository.ProductRepository;
import com.example.invoice.mapper.ProductMapper;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/expiry")
@RequiredArgsConstructor
@Tag(name = "Expiry", description = "Expiry date management APIs")
public class ExpiryController
{
    private final ProductRepository productRepository;
    private final ProductMapper     productMapper;

    @GetMapping("/expiring")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getExpiring(
            @RequestParam(defaultValue = "30") int days) {
        LocalDate today = LocalDate.now();
        LocalDate limit = today.plusDays(days);

        List<ProductResponse> products = productRepository
                .findByActiveTrue(PageRequest.of(0, Integer.MAX_VALUE))
                .getContent().stream()
                .filter(p -> p.getExpiryDate() != null
                        && p.getExpiryDate().isAfter(today)
                        && p.getExpiryDate().isBefore(limit))
                .map(productMapper::toResponse)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/expired")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getExpired() {
        LocalDate today = LocalDate.now();

        List<ProductResponse> products = productRepository
                .findByActiveTrue(PageRequest.of(0, Integer.MAX_VALUE))
                .getContent().stream()
                .filter(p -> p.getExpiryDate() != null
                        && p.getExpiryDate().isBefore(today))
                .map(productMapper::toResponse)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getAlerts() {
        LocalDate today = LocalDate.now();
        LocalDate in30  = today.plusDays(30);

        List<com.example.invoice.domain.Product> all = productRepository
                .findByActiveTrue(PageRequest.of(0, Integer.MAX_VALUE))
                .getContent();

        long expiringSoon = all.stream()
                .filter(p -> p.getExpiryDate() != null
                        && p.getExpiryDate().isAfter(today)
                        && p.getExpiryDate().isBefore(in30)).count();

        long expired = all.stream()
                .filter(p -> p.getExpiryDate() != null
                        && p.getExpiryDate().isBefore(today)).count();

        long lowStock = all.stream()
                .filter(p -> p.getStock() <= p.getLowStockThreshold()).count();

        Map<String, Long> alerts = new LinkedHashMap<>();
        alerts.put("expiringSoon", expiringSoon);
        alerts.put("expired",      expired);
        alerts.put("lowStock",     lowStock);

        return ResponseEntity.ok(ApiResponse.success(alerts));
    }
}
