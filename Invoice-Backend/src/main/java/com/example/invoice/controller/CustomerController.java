package com.example.invoice.controller;

import com.example.invoice.dto.request.CustomerRequest;
import com.example.invoice.dto.response.ApiResponse;
import com.example.invoice.dto.response.CustomerResponse;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.service.interfaces.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@Tag(name = "Customer", description = "Customer management APIs")
public class CustomerController
{
    private final CustomerService customerService;

    @PostMapping
    @Operation(summary = "Create a new customer")
    public ResponseEntity<ApiResponse<CustomerResponse>> create(
            @Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Customer created successfully",
                        customerService.create(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update customer by ID")
    public ResponseEntity<ApiResponse<CustomerResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Customer updated successfully",
                        customerService.update(id, request)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get customer by ID")
    public ResponseEntity<ApiResponse<CustomerResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(customerService.getById(id)));
    }

    @GetMapping("/mobile/{mobileNumber}")
    @Operation(summary = "Find customer by mobile — used in POS auto-fill")
    public ResponseEntity<ApiResponse<CustomerResponse>> getByMobile(
            @PathVariable String mobileNumber) {
        Optional<CustomerResponse> customer = customerService.findByMobile(mobileNumber);
        return customer
                .map(c -> ResponseEntity.ok(ApiResponse.success(c)))
                .orElseGet(() -> ResponseEntity.ok(
                        ApiResponse.<CustomerResponse>builder()
                                .success(true)
                                .message("Customer not found — will be created on checkout")
                                .build()));
    }

    @GetMapping
    @Operation(summary = "Get all customers (paginated)")
    public ResponseEntity<ApiResponse<PageResponse<CustomerResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(customerService.getAll(page, size)));
    }

    @GetMapping("/search")
    @Operation(summary = "Search customers by name or mobile")
    public ResponseEntity<ApiResponse<PageResponse<CustomerResponse>>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                ApiResponse.success(customerService.search(keyword, page, size)));
    }
}
