package com.example.invoice.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CustomerResponse
{
    private Long id;
    private String name;
    private String mobileNumber;
    private String email;
    private String address;
    private LocalDateTime createdAt;
}
