package com.example.invoice.dto.request;

import com.example.invoice.domain.enums.PaymentMode;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class ReturnRequest
{
    @NotNull private Long invoiceId;
    private String returnReason;
    private PaymentMode refundMode;
    @NotNull private List<ReturnItemRequest> items;
}
