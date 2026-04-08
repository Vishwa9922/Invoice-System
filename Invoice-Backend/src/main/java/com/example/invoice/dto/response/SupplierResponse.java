package com.example.invoice.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SupplierResponse
{
    private Long id;
    private String name;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private String gstNumber;
    private Boolean active;
    private LocalDateTime createdAt;
}
