package com.example.invoice.service.impl;

import com.example.invoice.domain.*;
import com.example.invoice.domain.enums.ReturnStatus;
import com.example.invoice.domain.enums.StockMovementType;
import com.example.invoice.dto.request.ReturnRequest;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.dto.response.ReturnItemResponse;
import com.example.invoice.dto.response.ReturnResponse;
import com.example.invoice.exception.ResourceNotFoundException;
import com.example.invoice.exception.ValidationException;
import com.example.invoice.repository.*;
import com.example.invoice.service.interfaces.ReturnService;
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
public class ReturnServiceImpl implements ReturnService
{
    private final ReturnRepository    returnRepository;
    private final InvoiceRepository   invoiceRepository;
    private final ProductRepository   productRepository;
    private final CustomerRepository  customerRepository;
    private final StockMovementService stockMovementService;

    @Override
    public ReturnResponse createReturn(ReturnRequest request) {
        Invoice invoice = invoiceRepository.findById(request.getInvoiceId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invoice", request.getInvoiceId()));

        // Build return items + calculate refund
        List<ReturnItem> returnItems = new ArrayList<>();
        BigDecimal totalRefund       = BigDecimal.ZERO;

        Return returnReq = Return.builder()
                .invoice(invoice)
                .customer(invoice.getCustomer())
                .returnReason(request.getReturnReason())
                .refundMode(request.getRefundMode())
                .status(ReturnStatus.PENDING)
                .build();

        for (var req : request.getItems()) {
            Product product = productRepository.findById(req.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product", req.getProductId()));

            // Get unit price from original invoice
            BigDecimal unitPrice = invoice.getItems().stream()
                    .filter(i -> i.getProduct().getId().equals(req.getProductId()))
                    .findFirst()
                    .map(InvoiceItem::getUnitPrice)
                    .orElse(product.getPrice());

            BigDecimal refundAmt = unitPrice.multiply(
                    BigDecimal.valueOf(req.getQuantity()));
            totalRefund = totalRefund.add(refundAmt);

            ReturnItem item = ReturnItem.builder()
                    .returnRequest(returnReq)
                    .product(product)
                    .quantity(req.getQuantity())
                    .refundAmount(refundAmt)
                    .build();
            returnItems.add(item);
        }

        returnReq.setReturnItems(returnItems);
        returnReq.setRefundAmount(totalRefund);
        Return saved = returnRepository.save(returnReq);
        log.info("Return request created id: {}", saved.getId());
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ReturnResponse getById(Long id) {
        return toResponse(findById(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReturnResponse> getAll(
            String status, String from, String to, int page, int size) {

        LocalDateTime fromDt = from != null
                ? LocalDate.parse(from).atStartOfDay() : null;
        LocalDateTime toDt   = to != null
                ? LocalDate.parse(to).atTime(23, 59, 59) : null;

        Page<Return> result;

        // Status aur date range ke combination ke hisaab se alag queries
        if (status != null && fromDt != null) {
            ReturnStatus returnStatus = ReturnStatus.valueOf(status);
            result = returnRepository.findByStatusAndCreatedAtBetween(
                    returnStatus, fromDt, toDt, PageRequest.of(page, size));
        } else if (status != null) {
            ReturnStatus returnStatus = ReturnStatus.valueOf(status);
            result = returnRepository.findByStatus(
                    returnStatus, PageRequest.of(page, size));
        } else if (fromDt != null) {
            result = returnRepository.findByCreatedAtBetween(
                    fromDt, toDt, PageRequest.of(page, size));
        } else {
            result = returnRepository.findAll(
                    PageRequest.of(page, size,
                            org.springframework.data.domain.Sort.by("createdAt").descending()));
        }

        return PageResponse.<ReturnResponse>builder()
                .content(result.getContent().stream().map(this::toResponse).toList())
                .pageNumber(result.getNumber())
                .pageSize(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Override
    public ReturnResponse approve(Long id) {
        Return returnReq = findById(id);
        if (returnReq.getStatus() != ReturnStatus.PENDING) {
            throw new ValidationException(
                    "Return is already " + returnReq.getStatus());
        }
        // Restore stock for each returned item
        returnReq.getReturnItems().forEach(item -> {
            Product product = item.getProduct();
            stockMovementService.logMovement(
                    product, StockMovementType.RETURN,
                    item.getQuantity(), returnReq.getId(),
                    "Return approved - Return#" + returnReq.getId(),
                    "system"
            );
            product.setStock(product.getStock() + item.getQuantity());
            productRepository.save(product);
        });

        returnReq.setStatus(ReturnStatus.APPROVED);
        log.info("Return approved id: {} — stock restored", id);
        return toResponse(returnRepository.save(returnReq));
    }

    @Override
    public ReturnResponse reject(Long id) {
        Return returnReq = findById(id);
        if (returnReq.getStatus() != ReturnStatus.PENDING) {
            throw new ValidationException(
                    "Return is already " + returnReq.getStatus());
        }
        returnReq.setStatus(ReturnStatus.REJECTED);
        return toResponse(returnRepository.save(returnReq));
    }

    private Return findById(Long id) {
        return returnRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Return", id));
    }

    private ReturnResponse toResponse(Return r) {
        ReturnResponse res = new ReturnResponse();
        res.setId(r.getId());
        res.setInvoiceId(r.getInvoice().getId());
        res.setInvoiceNumber(r.getInvoice().getInvoiceNumber());
        res.setCustomerId(r.getCustomer().getId());
        res.setCustomerName(r.getCustomer().getName());
        res.setReturnReason(r.getReturnReason());
        res.setRefundAmount(r.getRefundAmount());
        res.setRefundMode(r.getRefundMode());
        res.setStatus(r.getStatus());
        res.setCreatedAt(r.getCreatedAt());
        if (r.getReturnItems() != null) {
            res.setReturnItems(r.getReturnItems().stream().map(i -> {
                ReturnItemResponse ir = new ReturnItemResponse();
                ir.setId(i.getId());
                ir.setProductId(i.getProduct().getId());
                ir.setProductName(i.getProduct().getName());
                ir.setQuantity(i.getQuantity());
                ir.setRefundAmount(i.getRefundAmount());
                return ir;
            }).toList());
        }
        return res;
    }
}
