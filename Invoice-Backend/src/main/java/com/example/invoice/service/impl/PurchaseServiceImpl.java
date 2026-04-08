package com.example.invoice.service.impl;

import com.example.invoice.domain.*;
import com.example.invoice.domain.enums.StockMovementType;
import com.example.invoice.dto.request.PurchaseRequest;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.dto.response.PurchaseItemResponse;
import com.example.invoice.dto.response.PurchaseResponse;
import com.example.invoice.exception.ResourceNotFoundException;
import com.example.invoice.exception.ValidationException;
import com.example.invoice.repository.*;
import com.example.invoice.service.interfaces.PurchaseService;
import com.example.invoice.service.interfaces.StockMovementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PurchaseServiceImpl implements PurchaseService {

    private final PurchaseRepository    purchaseRepository;
    private final ProductRepository     productRepository;
    private final SupplierRepository    supplierRepository;
    private final StockMovementService  stockMovementService;

    @Override
    public PurchaseResponse create(PurchaseRequest request) {
        Supplier supplier = request.getSupplierId() != null
                ? supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Supplier", request.getSupplierId()))
                : null;

        List<PurchaseItem> items    = new ArrayList<>();
        BigDecimal         total    = BigDecimal.ZERO;

        Purchase purchase = Purchase.builder()
                .supplier(supplier)
                .paymentMode(request.getPaymentMode())
                .note(request.getNote())
                .purchaseDate(request.getPurchaseDate() != null
                        ? request.getPurchaseDate() : LocalDate.now())
                .totalAmount(BigDecimal.ZERO)
                .build();

        for (var req : request.getItems()) {
            Product product = productRepository.findById(req.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product", req.getProductId()));

            BigDecimal lineTotal = req.getPurchasePrice()
                    .multiply(BigDecimal.valueOf(req.getQuantity()));
            total = total.add(lineTotal);

            PurchaseItem item = PurchaseItem.builder()
                    .purchase(purchase)
                    .product(product)
                    .quantity(req.getQuantity())
                    .purchasePrice(req.getPurchasePrice())
                    .lineTotal(lineTotal)
                    .build();
            items.add(item);

            // Increase stock + log PURCHASE movement
            stockMovementService.logMovement(
                    product, StockMovementType.PURCHASE,
                    req.getQuantity(), null,
                    "Purchase from " + (supplier != null ? supplier.getName() : "unknown"),
                    "system"
            );
            product.setStock(product.getStock() + req.getQuantity());
            productRepository.save(product);
        }

        purchase.setItems(items);
        purchase.setTotalAmount(total);
        Purchase saved = purchaseRepository.save(purchase);
        log.info("Purchase created id: {}", saved.getId());
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseResponse getById(Long id) {
        return toResponse(purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase", id)));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PurchaseResponse> getAll(
            Long supplierId, String from, String to, int page, int size) {

        LocalDateTime fromDt = from != null
                ? LocalDate.parse(from).atStartOfDay() : null;
        LocalDateTime toDt   = to != null
                ? LocalDate.parse(to).atTime(23, 59, 59) : null;

        Page<Purchase> result;

        if (supplierId != null && fromDt != null) {
            result = purchaseRepository
                    .findBySupplierIdAndCancelledFalseAndCreatedAtBetween(
                            supplierId, fromDt, toDt, PageRequest.of(page, size));
        } else if (supplierId != null) {
            result = purchaseRepository
                    .findBySupplierIdAndCancelledFalse(
                            supplierId, PageRequest.of(page, size));
        } else if (fromDt != null) {
            result = purchaseRepository
                    .findByCancelledFalseAndCreatedAtBetween(
                            fromDt, toDt, PageRequest.of(page, size));
        } else {
            result = purchaseRepository.findByCancelledFalse(
                    PageRequest.of(page, size));
        }

        return PageResponse.<PurchaseResponse>builder()
                .content(result.getContent().stream().map(this::toResponse).toList())
                .pageNumber(result.getNumber())
                .pageSize(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Override
    public void cancel(Long id) {
        Purchase purchase = purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase", id));
        if (purchase.getCancelled()) {
            throw new ValidationException("Purchase is already cancelled");
        }
        // Reverse stock
        purchase.getItems().forEach(item -> {
            Product product = item.getProduct();
            stockMovementService.logMovement(
                    product, StockMovementType.CORRECTION,
                    -item.getQuantity(), purchase.getId(),
                    "Purchase cancelled id: " + purchase.getId(),
                    "system"
            );
            product.setStock(product.getStock() - item.getQuantity());
            productRepository.save(product);
        });
        purchase.setCancelled(true);
        purchaseRepository.save(purchase);
    }

    private PurchaseResponse toResponse(Purchase p) {
        PurchaseResponse r = new PurchaseResponse();
        r.setId(p.getId());
        if (p.getSupplier() != null) {
            r.setSupplierId(p.getSupplier().getId());
            r.setSupplierName(p.getSupplier().getName());
        }
        r.setTotalAmount(p.getTotalAmount());
        r.setPaymentMode(p.getPaymentMode());
        r.setNote(p.getNote());
        r.setPurchaseDate(p.getPurchaseDate());
        r.setCancelled(p.getCancelled());
        r.setCreatedAt(p.getCreatedAt());
        r.setItems(p.getItems() != null ? p.getItems().stream().map(i -> {
            PurchaseItemResponse ir = new PurchaseItemResponse();
            ir.setId(i.getId());
            ir.setProductId(i.getProduct().getId());
            ir.setProductName(i.getProduct().getName());
            ir.setQuantity(i.getQuantity());
            ir.setPurchasePrice(i.getPurchasePrice());
            ir.setLineTotal(i.getLineTotal());
            return ir;
        }).toList() : List.of());
        return r;
    }
}