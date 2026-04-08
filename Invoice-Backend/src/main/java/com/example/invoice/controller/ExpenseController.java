package com.example.invoice.controller;

import com.example.invoice.dto.request.ExpenseRequest;
import com.example.invoice.dto.response.ApiResponse;
import com.example.invoice.dto.response.ExpenseResponse;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.service.interfaces.ExpenseService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@Tag(name = "Expense", description = "Expense management APIs")
public class ExpenseController
{
    private final ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseResponse>> create(
            @Valid @RequestBody ExpenseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Expense created",
                        expenseService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExpenseResponse>> update(
            @PathVariable Long id, @Valid @RequestBody ExpenseRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Expense updated",
                expenseService.update(id, request)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExpenseResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(expenseService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ExpenseResponse>>> getAll(
            @RequestParam(required = false)    String category,
            @RequestParam(required = false)    String from,
            @RequestParam(required = false)    String to,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                expenseService.getAll(category, from, to, page, size)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        expenseService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Expense deleted", null));
    }
}
