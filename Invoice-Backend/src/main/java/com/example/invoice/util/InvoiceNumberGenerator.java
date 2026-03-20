package com.example.invoice.util;

import com.example.invoice.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

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
        return invoiceRepository.findLastInvoiceNumber()
                .map(last -> {
                    // Extract number from e.g. "INV-1042"
                    String[] parts = last.split("-");
                    int next = Integer.parseInt(parts[parts.length - 1]) + 1;
                    return prefix + "-" + next;
                })
                .orElse(prefix + "-" + startNumber);
    }
}
