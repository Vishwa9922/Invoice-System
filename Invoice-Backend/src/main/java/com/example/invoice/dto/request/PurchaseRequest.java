package com.example.invoice.dto.request;

import com.example.invoice.domain.enums.PaymentMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class PurchaseRequest
{
    private Long supplierId;
    @NotEmpty @Valid
    private List<PurchaseItemRequest> items;
    private PaymentMode paymentMode;
    private String note;
    private LocalDate purchaseDate;
}
