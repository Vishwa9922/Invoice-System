package com.example.invoice.dto.response;

import com.example.invoice.domain.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse
{
    private String token;
    private String email;
    private String name;
    private Role role;
    private long expiresIn; // milliseconds
}
