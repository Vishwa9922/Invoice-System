package com.example.invoice.controller;

import com.example.invoice.dto.request.PosRequest;
import com.example.invoice.dto.response.ApiResponse;
import com.example.invoice.dto.response.InvoiceResponse;
import com.example.invoice.service.interfaces.PosService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pos")
@RequiredArgsConstructor
@Tag(name = "POS", description = "Point of Sale checkout API")
public class PosController
{
    private final PosService posService;

    @PostMapping("/checkout")
    @Operation(summary = "POS Checkout — creates customer if new, generates invoice")
    public ResponseEntity<ApiResponse<InvoiceResponse>> checkout(
            @Valid @RequestBody PosRequest request) {
        InvoiceResponse response = posService.checkout(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Checkout successful. Invoice: " + response.getInvoiceNumber(),
                        response));
    }
}
