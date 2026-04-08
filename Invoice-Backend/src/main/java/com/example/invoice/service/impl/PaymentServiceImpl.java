package com.example.invoice.service.impl;

import com.example.invoice.domain.Invoice;
import com.example.invoice.domain.Payment;
import com.example.invoice.domain.enums.InvoiceStatus;
import com.example.invoice.domain.enums.PaymentStatus;
import com.example.invoice.dto.request.PaymentRequest;
import com.example.invoice.dto.response.PaymentResponse;
import com.example.invoice.exception.ResourceNotFoundException;
import com.example.invoice.exception.ValidationException;
import com.example.invoice.repository.InvoiceRepository;
import com.example.invoice.repository.PaymentRepository;
import com.example.invoice.service.interfaces.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentServiceImpl implements PaymentService
{
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    @Override
    public PaymentResponse recordPayment(PaymentRequest request) {
        Invoice invoice = invoiceRepository.findById(request.getInvoiceId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invoice", request.getInvoiceId()));

        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new ValidationException("Cannot add payment to cancelled invoice");
        }

        // Check if overpaying
        BigDecimal alreadyPaid = paymentRepository
                .sumPaidByInvoice(invoice.getId());
        BigDecimal remaining   = invoice.getGrandTotal().subtract(alreadyPaid);

        if (request.getAmount().compareTo(remaining) > 0) {
            throw new ValidationException(
                    "Payment amount exceeds remaining due: ₹" + remaining);
        }

        Payment payment = Payment.builder()
                .invoice(invoice)
                .amount(request.getAmount())
                .paymentMode(request.getPaymentMode())
                .note(request.getNote())
                .build();
        paymentRepository.save(payment);

        // Update invoice payment status
        BigDecimal newPaid = alreadyPaid.add(request.getAmount());
        invoice.setPaidAmount(newPaid);
        if (newPaid.compareTo(invoice.getGrandTotal()) >= 0) {
            invoice.setPaymentStatus(PaymentStatus.PAID);
        } else {
            invoice.setPaymentStatus(PaymentStatus.PARTIAL);
        }
        invoiceRepository.save(invoice);

        return toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getByInvoice(Long invoiceId) {
        return paymentRepository.findByInvoiceId(invoiceId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Object> getPendingDues() {
        return invoiceRepository.findAll().stream()
                .filter(inv -> inv.getStatus() != InvoiceStatus.CANCELLED &&
                        inv.getPaymentStatus() != PaymentStatus.PAID)
                .map(inv -> {
                    BigDecimal paid = paymentRepository.sumPaidByInvoice(inv.getId());
                    BigDecimal due  = inv.getGrandTotal().subtract(paid);
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("invoiceId",     inv.getId());
                    map.put("invoiceNumber", inv.getInvoiceNumber());
                    map.put("customerName",  inv.getCustomer().getName());
                    map.put("mobile",        inv.getCustomer().getMobileNumber());
                    map.put("grandTotal",    inv.getGrandTotal());
                    map.put("paidAmount",    paid);
                    map.put("dueAmount",     due);
                    map.put("paymentStatus", inv.getPaymentStatus());
                    return (Object) map;
                }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public String generateWhatsAppReminder(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invoice", invoiceId));
        BigDecimal paid = paymentRepository.sumPaidByInvoice(invoiceId);
        BigDecimal due  = invoice.getGrandTotal().subtract(paid);

        return String.format(
                "Dear %s,\n\nThis is a friendly reminder that you have a pending payment.\n\n" +
                        "Invoice No: %s\nTotal Amount: ₹%s\nPaid: ₹%s\nDue Amount: ₹%s\n\n" +
                        "Please make the payment at your earliest convenience.\n\nThank you!",
                invoice.getCustomer().getName() != null
                        ? invoice.getCustomer().getName() : "Customer",
                invoice.getInvoiceNumber(),
                invoice.getGrandTotal(), paid, due
        );
    }

    private PaymentResponse toResponse(Payment p) {
        PaymentResponse r = new PaymentResponse();
        r.setId(p.getId());
        r.setInvoiceId(p.getInvoice().getId());
        r.setInvoiceNumber(p.getInvoice().getInvoiceNumber());
        r.setAmount(p.getAmount());
        r.setPaymentMode(p.getPaymentMode());
        r.setNote(p.getNote());
        r.setCreatedAt(p.getCreatedAt());
        return r;
    }
}
