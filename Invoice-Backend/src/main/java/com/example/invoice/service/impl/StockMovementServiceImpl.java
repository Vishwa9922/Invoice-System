package com.example.invoice.service.impl;

import com.example.invoice.domain.Product;
import com.example.invoice.domain.StockMovement;
import com.example.invoice.domain.enums.StockMovementType;
import com.example.invoice.dto.request.StockAdjustRequest;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.dto.response.StockGraphResponse;
import com.example.invoice.dto.response.StockMovementResponse;
import com.example.invoice.exception.ResourceNotFoundException;
import com.example.invoice.exception.ValidationException;
import com.example.invoice.repository.ProductRepository;
import com.example.invoice.repository.StockMovementRepository;
import com.example.invoice.service.interfaces.StockMovementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class StockMovementServiceImpl implements StockMovementService
{
    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository       productRepository;

    @Override
    public void logMovement(Product product, StockMovementType type,
                            int quantityChanged, Long referenceId,
                            String note, String createdBy) {
        StockMovement movement = StockMovement.builder()
                .product(product)
                .movementType(type)
                .quantityChanged(quantityChanged)
                .stockBefore(product.getStock())
                .stockAfter(product.getStock() + quantityChanged)
                .referenceId(referenceId)
                .note(note)
                .createdBy(createdBy != null ? createdBy : "system")
                .build();
        stockMovementRepository.save(movement);
        log.info("Stock movement logged: {} {} units for product {}",
                type, quantityChanged, product.getName());
    }

    @Override
    public void adjustStock(StockAdjustRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Product", request.getProductId()));

        int newStock = product.getStock() + request.getQuantity();
        if (newStock < 0) {
            throw new ValidationException(
                    "Stock cannot go below 0. Current: " + product.getStock());
        }

        // Log before updating
        logMovement(product, request.getMovementType(),
                request.getQuantity(), null,
                request.getNote(), request.getAdjustedBy());

        // Update stock
        product.setStock(newStock);
        productRepository.save(product);
        log.info("Manual stock adjustment: product {} new stock {}",
                product.getName(), newStock);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StockMovementResponse> getMovements(
            Long productId, String type, String from, String to,
            int page, int size) {

        StockMovementType movType = type != null && !type.isBlank()
                ? StockMovementType.valueOf(type) : null;
        LocalDateTime fromDt = from != null && !from.isBlank()
                ? LocalDate.parse(from).atStartOfDay() : null;
        LocalDateTime toDt   = to != null && !to.isBlank()
                ? LocalDate.parse(to).atTime(23, 59, 59) : null;

        Page<StockMovement> result;

        if (movType != null && fromDt != null) {
            result = stockMovementRepository
                    .findByProductIdAndMovementTypeAndCreatedAtBetween(
                            productId, movType, fromDt, toDt,
                            PageRequest.of(page, size));
        } else if (movType != null) {
            result = stockMovementRepository
                    .findByProductIdAndMovementType(
                            productId, movType, PageRequest.of(page, size));
        } else if (fromDt != null) {
            result = stockMovementRepository
                    .findByProductIdAndCreatedAtBetween(
                            productId, fromDt, toDt, PageRequest.of(page, size));
        } else {
            result = stockMovementRepository
                    .findByProductId(productId, PageRequest.of(page, size));
        }

        return PageResponse.<StockMovementResponse>builder()
                .content(result.getContent().stream()
                        .map(this::toResponse).toList())
                .pageNumber(result.getNumber())
                .pageSize(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockGraphResponse> getGraphData(
            Long productId, String from, String to) {

        LocalDateTime fromDt = from != null
                ? LocalDate.parse(from).atStartOfDay()
                : LocalDateTime.now().minusMonths(1);
        LocalDateTime toDt   = to != null
                ? LocalDate.parse(to).atTime(23, 59, 59)
                : LocalDateTime.now();

        List<StockMovement> movements =
                stockMovementRepository.findForGraph(productId, fromDt, toDt);

        return movements.stream()
                .map(m -> new StockGraphResponse(
                        m.getCreatedAt(),
                        m.getStockAfter(),
                        m.getMovementType().name()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Object getStockSummary() {
        List<Product> products = productRepository
                .findByActiveTrue(PageRequest.of(0, Integer.MAX_VALUE))
                .getContent();

        long totalProducts  = products.size();
        long outOfStock     = products.stream()
                .filter(p -> p.getStock() == 0).count();
        long lowStock       = products.stream()
                .filter(p -> p.getStock() > 0 &&
                        p.getStock() <= p.getLowStockThreshold()).count();

        double totalValue   = products.stream()
                .mapToDouble(p -> p.getPurchasePrice().doubleValue() * p.getStock())
                .sum();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalProducts",  totalProducts);
        summary.put("outOfStock",     outOfStock);
        summary.put("lowStock",       lowStock);
        summary.put("totalStockValue", totalValue);
        return summary;
    }

    private StockMovementResponse toResponse(StockMovement m) {
        StockMovementResponse r = new StockMovementResponse();
        r.setId(m.getId());
        r.setProductId(m.getProduct().getId());
        r.setProductName(m.getProduct().getName());
        r.setMovementType(m.getMovementType());
        r.setQuantityChanged(m.getQuantityChanged());
        r.setStockBefore(m.getStockBefore());
        r.setStockAfter(m.getStockAfter());
        r.setReferenceId(m.getReferenceId());
        r.setNote(m.getNote());
        r.setCreatedBy(m.getCreatedBy());
        r.setCreatedAt(m.getCreatedAt());
        return r;
    }
}
