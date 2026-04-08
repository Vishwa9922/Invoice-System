package com.example.invoice.util;

import com.example.invoice.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class InvoiceNumberGenerator
{
    @Value("${app.invoice.prefix:INV}")
    private String prefix;

    @Value("${app.invoice.start-number:1000}")
    private int startNumber;

    private final InvoiceRepository invoiceRepository;

    public String generate() {
        int year = LocalDate.now().getYear();

        return invoiceRepository.findLastInvoiceNumber()
                .map(last -> {
                    // Format: INV-2026-00001
                    String[] parts = last.split("-");
                    int next = Integer.parseInt(parts[parts.length - 1]) + 1;
                    return String.format("%s-%d-%05d", prefix, year, next);
                })
                .orElse(String.format("%s-%d-%05d", prefix, year, startNumber));
    }
}
