package com.example.invoice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SupplierRequest
{
    @NotBlank(message = "Supplier name is required")
    private String name;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private String gstNumber;
    private Boolean active = true;
}
