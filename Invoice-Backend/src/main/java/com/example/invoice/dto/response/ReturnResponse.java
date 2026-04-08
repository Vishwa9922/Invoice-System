package com.example.invoice.dto.response;

import com.example.invoice.domain.enums.PaymentMode;
import com.example.invoice.domain.enums.ReturnStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ReturnResponse
{
    private Long id;
    private Long invoiceId;
    private String invoiceNumber;
    private Long customerId;
    private String customerName;
    private List<ReturnItemResponse> returnItems;
    private String returnReason;
    private BigDecimal refundAmount;
    private PaymentMode refundMode;
    private ReturnStatus status;
    private LocalDateTime createdAt;
}
