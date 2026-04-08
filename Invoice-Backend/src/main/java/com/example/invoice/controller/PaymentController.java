package com.example.invoice.controller;

import com.example.invoice.dto.request.PaymentRequest;
import com.example.invoice.dto.response.ApiResponse;
import com.example.invoice.dto.response.PaymentResponse;
import com.example.invoice.service.interfaces.PaymentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payment", description = "Payment & Dues APIs")
public class PaymentController
{
    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> record(
            @Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment recorded",
                        paymentService.recordPayment(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getByInvoice(
            @RequestParam Long invoiceId) {
        return ResponseEntity.ok(ApiResponse.success(
                paymentService.getByInvoice(invoiceId)));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<Object>>> getPendingDues() {
        return ResponseEntity.ok(ApiResponse.success(
                paymentService.getPendingDues()));
    }

    @GetMapping("/reminder/{invoiceId}")
    public ResponseEntity<ApiResponse<String>> getReminder(
            @PathVariable Long invoiceId) {
        return ResponseEntity.ok(ApiResponse.success(
                paymentService.generateWhatsAppReminder(invoiceId)));
    }
}
