package com.example.invoice.service.impl;

import com.example.invoice.domain.enums.Role;
import com.example.invoice.domain.User;
import com.example.invoice.dto.request.LoginRequest;
import com.example.invoice.dto.request.RegisterRequest;
import com.example.invoice.dto.response.AuthResponse;
import com.example.invoice.exception.DuplicateResourceException;
import com.example.invoice.repository.UserRepository;
import com.example.invoice.security.JwtService;
import com.example.invoice.service.interfaces.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService
{
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Override
    public AuthResponse login(LoginRequest request) {
        // Spring Security handles authentication — throws exception if wrong
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();

        String token = jwtService.generateToken(user);
        log.info("User logged in: {}", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .expiresIn(jwtService.getExpirationTime())
                .build();
    }


    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException(
                    "Email already registered: " + request.getEmail());
        }

        // ── Role assignment logic ──────────────────────────────────────
        Role assignedRole;
        long userCount = userRepository.count();

        if (userCount == 0) {
            // Pehla user hamesha ADMIN banega — fresh install ke liye
            assignedRole = Role.ADMIN;
        } else {
            // Baad mein sirf CASHIER register ho sakta hai freely
            // ADMIN banana hai toh existing admin ka token chahiye
            assignedRole = Role.CASHIER;
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(assignedRole)
                .active(true)
                .build();

        userRepository.save(user);
        log.info("New user registered: {} ({})", user.getEmail(), assignedRole);

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .role(assignedRole)
                .expiresIn(jwtService.getExpirationTime())
                .build();
    }
}
