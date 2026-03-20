package com.example.invoice.service.impl;

import com.example.invoice.domain.*;
import com.example.invoice.domain.enums.InvoiceStatus;
import com.example.invoice.dto.request.InvoiceItemRequest;
import com.example.invoice.dto.request.InvoiceRequest;
import com.example.invoice.dto.response.InvoiceResponse;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.exception.InsufficientStockException;
import com.example.invoice.exception.ResourceNotFoundException;
import com.example.invoice.exception.ValidationException;
import com.example.invoice.mapper.InvoiceMapper;
import com.example.invoice.repository.CustomerRepository;
import com.example.invoice.repository.InvoiceRepository;
import com.example.invoice.repository.ProductRepository;
import com.example.invoice.service.interfaces.InvoiceService;
import com.example.invoice.util.DateUtils;
import com.example.invoice.util.InvoiceNumberGenerator;
import com.example.invoice.util.TaxCalculator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InvoiceServiceImpl implements InvoiceService
{
    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final InvoiceMapper invoiceMapper;
    private final InvoiceNumberGenerator invoiceNumberGenerator;

    @Override
    public InvoiceResponse create(InvoiceRequest request) {
        log.info("Creating invoice for customer id: {}", request.getCustomerId());

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", request.getCustomerId()));

        // Build invoice items + validate stock
        List<InvoiceItem> items = buildInvoiceItems(request.getItems());

        // Calculate totals
        BigDecimal subtotal = items.stream()
                .map(InvoiceItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalTax = items.stream()
                .map(InvoiceItem::getLineTax)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal discount = request.getDiscount() != null
                ? request.getDiscount() : BigDecimal.ZERO;

        BigDecimal grandTotal = TaxCalculator.calculateGrandTotal(subtotal, totalTax, discount);

        // Build invoice
        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumberGenerator.generate())
                .customer(customer)
                .paymentMode(request.getPaymentMode())
                .subtotal(subtotal)
                .totalTax(totalTax)
                .discount(discount)
                .grandTotal(grandTotal)
                .notes(request.getNotes())
                .status(InvoiceStatus.PAID)
                .build();

        // Link items to invoice
        items.forEach(item -> item.setInvoice(invoice));
        invoice.setItems(items);

        // Deduct stock
        items.forEach(item ->
                productRepository.findById(item.getProduct().getId()).ifPresent(p -> {
                    p.setStock(p.getStock() - item.getQuantity());
                    productRepository.save(p);
                })
        );

        Invoice saved = invoiceRepository.save(invoice);
        log.info("Invoice created: {}", saved.getInvoiceNumber());
        return invoiceMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));
        return invoiceMapper.toResponse(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getByInvoiceNumber(String invoiceNumber) {
        Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invoice not found: " + invoiceNumber));
        return invoiceMapper.toResponse(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InvoiceResponse> getAll(int page, int size) {
        Page<Invoice> result = invoiceRepository.findAll(PageRequest.of(page, size));
        return buildPageResponse(result);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InvoiceResponse> getByCustomer(Long customerId, int page, int size) {
        Page<Invoice> result = invoiceRepository.findByCustomerId(
                customerId, PageRequest.of(page, size));
        return buildPageResponse(result);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InvoiceResponse> getByDateRange(String from, String to, int page, int size) {
        Page<Invoice> result = invoiceRepository.findByCreatedAtBetween(
                DateUtils.startOfDay(LocalDate.parse(from)),
                DateUtils.endOfDay(LocalDate.parse(to)),
                PageRequest.of(page, size));
        return buildPageResponse(result);
    }

    @Override
    public void cancel(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));
        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new ValidationException("Invoice is already cancelled");
        }
        invoice.setStatus(InvoiceStatus.CANCELLED);
        invoiceRepository.save(invoice);
        log.info("Invoice cancelled: {}", invoice.getInvoiceNumber());
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private List<InvoiceItem> buildInvoiceItems(List<InvoiceItemRequest> itemRequests) {
        List<InvoiceItem> items = new ArrayList<>();
        for (InvoiceItemRequest req : itemRequests) {
            Product product = productRepository.findById(req.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", req.getProductId()));

            if (!product.getActive()) {
                throw new ValidationException("Product is inactive: " + product.getName());
            }
            if (product.getStock() < req.getQuantity()) {
                throw new InsufficientStockException(
                        product.getName(), product.getStock(), req.getQuantity());
            }

            BigDecimal lineTotal = TaxCalculator.calculateLineTotal(
                    product.getPrice(), req.getQuantity());
            BigDecimal lineTax = TaxCalculator.calculateLineTax(
                    product.getPrice(), product.getTaxPercent(), req.getQuantity());

            items.add(InvoiceItem.builder()
                    .product(product)
                    .productName(product.getName())
                    .unitPrice(product.getPrice())
                    .taxPercent(product.getTaxPercent())
                    .quantity(req.getQuantity())
                    .lineTotal(lineTotal)
                    .lineTax(lineTax)
                    .build());
        }
        return items;
    }

    private PageResponse<InvoiceResponse> buildPageResponse(Page<Invoice> page) {
        return PageResponse.<InvoiceResponse>builder()
                .content(page.getContent().stream().map(invoiceMapper::toResponse).toList())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
