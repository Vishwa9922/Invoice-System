package com.example.invoice.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "business_settings")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BusinessSettings
{
    @Id
    private Long id = 1L; // Singleton — always one record

    @Column(length = 150)
    private String businessName;

    @Column(length = 255)
    private String address;

    @Column(length = 15)
    private String phone;

    @Column(length = 150)
    private String email;

    @Column(length = 20)
    private String gstNumber;

    @Column(length = 255)
    private String logoUrl;

    @Column(length = 10)
    @Builder.Default
    private String currency = "INR";

    @Column(precision = 5, scale = 2)
    private java.math.BigDecimal defaultTaxRate;

    @Column(length = 10)
    @Builder.Default
    private String invoicePrefix = "INV";

    @Builder.Default
    private Boolean lowStockAlertEnabled = true;

    @Builder.Default
    private Integer expiryAlertDays = 30;
}
