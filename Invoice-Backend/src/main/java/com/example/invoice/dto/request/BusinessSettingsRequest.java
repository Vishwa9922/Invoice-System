package com.example.invoice.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class BusinessSettingsRequest
{
    private String businessName;
    private String address;
    private String phone;
    private String email;
    private String gstNumber;
    private String logoUrl;
    private String currency;
    private BigDecimal defaultTaxRate;
    private String invoicePrefix;
    private Boolean lowStockAlertEnabled;
    private Integer expiryAlertDays;
}
