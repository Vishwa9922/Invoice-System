package com.example.invoice.controller;

import com.example.invoice.domain.BusinessSettings;
import com.example.invoice.dto.request.BusinessSettingsRequest;
import com.example.invoice.dto.response.ApiResponse;
import com.example.invoice.service.interfaces.BusinessSettingsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@Tag(name = "Settings", description = "Business settings API")
public class BusinessSettingsController
{
    private final BusinessSettingsService settingsService;

    @GetMapping
    public ResponseEntity<ApiResponse<BusinessSettings>> get() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.get()));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BusinessSettings>> update(
            @RequestBody BusinessSettingsRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Settings updated", settingsService.update(request)));
    }
}
