package com.example.invoice.dto.response;

import com.example.invoice.domain.enums.Role;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserResponse
{
    private Long id;
    private String name;
    private String email;
    private Role role;
    private Boolean active;
    private LocalDateTime createdAt;
}
