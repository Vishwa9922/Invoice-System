package com.example.invoice.controller;

import com.example.invoice.domain.enums.Role;
import com.example.invoice.dto.request.LoginRequest;
import com.example.invoice.dto.request.RegisterRequest;
import com.example.invoice.dto.response.ApiResponse;
import com.example.invoice.dto.response.AuthResponse;
import com.example.invoice.service.interfaces.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Login and Register APIs")
public class AuthController
{
    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register new user (ADMIN or CASHIER)")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Registered successfully",
                        authService.register(request)));
    }

    @PostMapping("/login")
    @Operation(summary = "Login — returns JWT token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Login successful",
                        authService.login(request)));
    }

    @PostMapping("/register/admin")
    @Operation(summary = "Create admin user — existing admin only")
    @PreAuthorize("hasRole('ADMIN')")  // sirf admin call kar sakta hai
    public ResponseEntity<ApiResponse<AuthResponse>> registerAdmin(
            @Valid @RequestBody RegisterRequest request) {
        request.setRole(Role.ADMIN); // force ADMIN role
        return ResponseEntity.ok(
                ApiResponse.success("Admin registered successfully",
                        authService.register(request)));
    }
}
