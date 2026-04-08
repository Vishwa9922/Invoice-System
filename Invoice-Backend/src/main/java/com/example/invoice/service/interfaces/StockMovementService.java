package com.example.invoice.service.interfaces;

import com.example.invoice.domain.Product;
import com.example.invoice.domain.enums.StockMovementType;
import com.example.invoice.dto.request.StockAdjustRequest;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.dto.response.StockMovementResponse;
import com.example.invoice.dto.response.StockGraphResponse;

import java.util.List;

public interface StockMovementService
{
    // Log movement — called internally by other services
    void logMovement(Product product, StockMovementType type,
                     int quantityChanged, Long referenceId,
                     String note, String createdBy);

    // Manual stock adjustment
    void adjustStock(StockAdjustRequest request);

    // Get movement history
    PageResponse<StockMovementResponse> getMovements(
            Long productId, String type, String from, String to,
            int page, int size);

    // Graph data — stock level over time
    List<StockGraphResponse> getGraphData(Long productId, String from, String to);

    // Stock summary
    Object getStockSummary();
}
