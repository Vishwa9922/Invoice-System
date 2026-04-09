package com.example.invoice.service.impl;

import com.example.invoice.dto.request.InvoiceRequest;
import com.example.invoice.dto.request.PosRequest;
import com.example.invoice.dto.response.CustomerResponse;
import com.example.invoice.dto.response.InvoiceResponse;
import com.example.invoice.service.interfaces.CustomerService;
import com.example.invoice.service.interfaces.InvoiceService;
import com.example.invoice.service.interfaces.PosService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PosServiceImpl implements PosService {

    private final CustomerService customerService;
    private final InvoiceService invoiceService;

    @Override
    public InvoiceResponse checkout(PosRequest request) {
        log.info("POS checkout for mobile: {}", request.getMobileNumber());

        // Step 1: Get existing customer OR create new one
        CustomerResponse customer = customerService.getOrCreate(
                request.getMobileNumber(),
                request.getCustomerName()
        );

        // Step 2: Build invoice request from POS request
        InvoiceRequest invoiceRequest = new InvoiceRequest();
        invoiceRequest.setCustomerId(customer.getId());
        invoiceRequest.setItems(request.getItems());
        invoiceRequest.setPaymentMode(request.getPaymentMode());
        invoiceRequest.setDiscount(request.getDiscount());
        invoiceRequest.setNotes(request.getNotes());

        // Step 3: Decode base64 signature → byte[] and set on invoice request
        if (request.getSignatureBase64() != null && !request.getSignatureBase64().isBlank()) {
            try {
                // Strip "data:image/png;base64," or similar prefix
                String base64Data = request.getSignatureBase64()
                        .replaceFirst("^data:image/[^;]+;base64,", "");
                byte[] signatureBytes = Base64.getDecoder().decode(base64Data);
                invoiceRequest.setSignatureImage(signatureBytes);
                log.info("Signature decoded successfully, size: {} bytes", signatureBytes.length);
            } catch (Exception e) {
                log.warn("Failed to decode signature image, skipping: {}", e.getMessage());
            }
        }

        // Step 4: Create invoice (handles stock deduction, tax calc, invoice number)
        InvoiceResponse response = invoiceService.create(invoiceRequest);
        log.info("POS checkout complete. Invoice: {}", response.getInvoiceNumber());
        return response;
    }
}