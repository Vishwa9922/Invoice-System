package com.example.invoice.controller;

import com.example.invoice.dto.request.StockAdjustRequest;
import com.example.invoice.dto.response.ApiResponse;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.dto.response.StockGraphResponse;
import com.example.invoice.dto.response.StockMovementResponse;
import com.example.invoice.service.interfaces.StockMovementService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
@Tag(name = "Stock", description = "Stock movement & adjustment APIs")
public class StockController
{
    private final StockMovementService stockMovementService;

    @GetMapping("/movements")
    public ResponseEntity<ApiResponse<PageResponse<StockMovementResponse>>> getMovements(
            @RequestParam              Long   productId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                stockMovementService.getMovements(
                        productId, type, from, to, page, size)));
    }

    @GetMapping("/movements/{productId}/graph")
    public ResponseEntity<ApiResponse<List<StockGraphResponse>>> getGraph(
            @PathVariable Long productId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        return ResponseEntity.ok(ApiResponse.success(
                stockMovementService.getGraphData(productId, from, to)));
    }

    @PostMapping("/adjust")
    public ResponseEntity<ApiResponse<Void>> adjust(
            @Valid @RequestBody StockAdjustRequest request) {
        stockMovementService.adjustStock(request);
        return ResponseEntity.ok(ApiResponse.success("Stock adjusted", null));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Object>> getSummary() {
        return ResponseEntity.ok(ApiResponse.success(
                stockMovementService.getStockSummary()));
    }
}
