package com.example.invoice.controller;

import com.example.invoice.dto.request.InvoiceRequest;
import com.example.invoice.dto.response.ApiResponse;
import com.example.invoice.dto.response.InvoiceResponse;
import com.example.invoice.dto.response.PageResponse;
import com.example.invoice.service.interfaces.InvoiceService;
import com.example.invoice.service.interfaces.PdfService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@Tag(name = "Invoice", description = "Invoice management APIs")
public class InvoiceController
{
    private final InvoiceService invoiceService;
    private final PdfService pdfService;

    @PostMapping
    @Operation(summary = "Create invoice manually (non-POS)")
    public ResponseEntity<ApiResponse<InvoiceResponse>> create(
            @Valid @RequestBody InvoiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Invoice created successfully",
                        invoiceService.create(request)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get invoice by ID")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getById(id)));
    }

    @GetMapping("/number/{invoiceNumber}")
    @Operation(summary = "Get invoice by invoice number e.g. INV-1001")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getByNumber(
            @PathVariable String invoiceNumber) {
        return ResponseEntity.ok(
                ApiResponse.success(invoiceService.getByInvoiceNumber(invoiceNumber)));
    }

    @GetMapping
    @Operation(summary = "Get all invoices (paginated)")
    public ResponseEntity<ApiResponse<PageResponse<InvoiceResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getAll(page, size)));
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Get invoices by customer ID")
    public ResponseEntity<ApiResponse<PageResponse<InvoiceResponse>>> getByCustomer(
            @PathVariable Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                ApiResponse.success(invoiceService.getByCustomer(customerId, page, size)));
    }

    @GetMapping("/filter")
    @Operation(summary = "Filter invoices by date range — ?from=2024-01-01&to=2024-01-31")
    public ResponseEntity<ApiResponse<PageResponse<InvoiceResponse>>> getByDateRange(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                ApiResponse.success(invoiceService.getByDateRange(from, to, page, size)));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel an invoice")
    public ResponseEntity<ApiResponse<Void>> cancel(@PathVariable Long id) {
        invoiceService.cancel(id);
        return ResponseEntity.ok(ApiResponse.success("Invoice cancelled", null));
    }

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Download invoice as PDF")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        byte[] pdfBytes = pdfService.generateInvoicePdf(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment",
                "invoice-" + id + ".pdf");
        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }
}
