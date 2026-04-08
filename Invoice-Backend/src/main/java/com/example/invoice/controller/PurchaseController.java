package com.example.invoice.controller;

import com.example.invoice.dto.request.PurchaseRequest;
import com.example.invoice.dto.response.ApiResponse;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.dto.response.PurchaseResponse;
import com.example.invoice.service.interfaces.PurchaseService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchases")
@RequiredArgsConstructor
@Tag(name = "Purchase", description = "Purchase/Restock APIs")
public class PurchaseController
{
    private final PurchaseService purchaseService;

    @PostMapping
    public ResponseEntity<ApiResponse<PurchaseResponse>> create(
            @Valid @RequestBody PurchaseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Purchase created",
                        purchaseService.create(request)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(purchaseService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PurchaseResponse>>> getAll(
            @RequestParam(required = false)    Long supplierId,
            @RequestParam(required = false)    String from,
            @RequestParam(required = false)    String to,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                purchaseService.getAll(supplierId, from, to, page, size)));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancel(@PathVariable Long id) {
        purchaseService.cancel(id);
        return ResponseEntity.ok(ApiResponse.success("Purchase cancelled", null));
    }
}
