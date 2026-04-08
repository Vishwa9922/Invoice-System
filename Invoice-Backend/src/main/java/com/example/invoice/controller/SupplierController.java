package com.example.invoice.controller;

import com.example.invoice.dto.request.SupplierRequest;
import com.example.invoice.dto.response.ApiResponse;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.dto.response.SupplierResponse;
import com.example.invoice.service.interfaces.SupplierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
@Tag(name = "Supplier", description = "Supplier management APIs")
public class SupplierController
{
    private final SupplierService supplierService;

    @PostMapping
    public ResponseEntity<ApiResponse<SupplierResponse>> create(
            @Valid @RequestBody SupplierRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Supplier created",
                        supplierService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SupplierResponse>> update(
            @PathVariable Long id, @Valid @RequestBody SupplierRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Supplier updated",
                supplierService.update(id, request)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SupplierResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(supplierService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<SupplierResponse>>> getAll(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false)    String search) {
        return ResponseEntity.ok(ApiResponse.success(
                supplierService.getAll(page, size, search)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        supplierService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Supplier deleted", null));
    }
}
