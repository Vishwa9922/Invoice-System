package com.example.invoice.service.interfaces;

import com.example.invoice.dto.request.LoginRequest;
import com.example.invoice.dto.request.RegisterRequest;
import com.example.invoice.dto.response.AuthResponse;

public interface AuthService
{
    AuthResponse login(LoginRequest request);
    AuthResponse register(RegisterRequest request);
}
