package com.example.invoice.controller;

import com.example.invoice.dto.request.ReturnRequest;
import com.example.invoice.dto.response.ApiResponse;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.dto.response.ReturnResponse;
import com.example.invoice.service.interfaces.ReturnService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/returns")
@RequiredArgsConstructor
@Tag(name = "Return", description = "Return & Refund APIs")

public class ReturnController
{
    private final ReturnService returnService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReturnResponse>> create(
            @Valid @RequestBody ReturnRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Return request created",
                        returnService.createReturn(request)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReturnResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(returnService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ReturnResponse>>> getAll(
            @RequestParam(required = false)    String status,
            @RequestParam(required = false)    String from,
            @RequestParam(required = false)    String to,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                returnService.getAll(status, from, to, page, size)));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<ReturnResponse>> approve(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Return approved",
                returnService.approve(id)));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<ReturnResponse>> reject(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Return rejected",
                returnService.reject(id)));
    }
}
