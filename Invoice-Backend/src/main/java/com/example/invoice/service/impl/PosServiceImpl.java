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

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PosServiceImpl implements PosService
{
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

        // Step 3: Create invoice (handles stock deduction, tax calc, invoice number)
        InvoiceResponse response = invoiceService.create(invoiceRequest);
        log.info("POS checkout complete. Invoice: {}", response.getInvoiceNumber());
        return response;
    }
}
