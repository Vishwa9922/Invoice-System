package com.example.invoice.service.impl;

import com.example.invoice.domain.Invoice;
import com.example.invoice.exception.ResourceNotFoundException;
import com.example.invoice.repository.InvoiceRepository;
import com.example.invoice.service.interfaces.PdfService;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class PdfServiceImpl implements PdfService
{
    private final InvoiceRepository invoiceRepository;

    @Override
    public byte[] generateInvoicePdf(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 40, 40, 60, 40);
            PdfWriter.getInstance(doc, out);
            doc.open();

            // ── Fonts ──────────────────────────────────────────────
            Font titleFont  = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD);
            Font headerFont = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD);
            Font bodyFont   = new Font(Font.FontFamily.HELVETICA, 10);
            Font smallFont  = new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL, BaseColor.GRAY);

            // ── Header ─────────────────────────────────────────────
            Paragraph title = new Paragraph("INVOICE", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            doc.add(title);
            doc.add(Chunk.NEWLINE);

            // Invoice meta
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);
            metaTable.setSpacingBefore(10);
            addMetaCell(metaTable, "Invoice No:", invoice.getInvoiceNumber(), headerFont, bodyFont);
            addMetaCell(metaTable, "Date:", invoice.getCreatedAt().toLocalDate().toString(), headerFont, bodyFont);
            addMetaCell(metaTable, "Customer:", invoice.getCustomer().getName() != null
                    ? invoice.getCustomer().getName() : "Walk-in Customer", headerFont, bodyFont);
            addMetaCell(metaTable, "Mobile:", invoice.getCustomer().getMobileNumber(), headerFont, bodyFont);
            addMetaCell(metaTable, "Payment:", invoice.getPaymentMode().name(), headerFont, bodyFont);
            addMetaCell(metaTable, "Status:", invoice.getStatus().name(), headerFont, bodyFont);
            doc.add(metaTable);
            doc.add(Chunk.NEWLINE);

            // ── Items table ────────────────────────────────────────
            PdfPTable itemTable = new PdfPTable(5);
            itemTable.setWidthPercentage(100);
            itemTable.setWidths(new float[]{3f, 1.2f, 1.5f, 1.2f, 1.5f});
            itemTable.setSpacingBefore(10);

            String[] headers = {"Product", "Qty", "Unit Price", "Tax", "Total"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                cell.setBackgroundColor(new BaseColor(52, 73, 94));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(6);
                Paragraph ph = new Paragraph(h, new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.WHITE));
                cell.setPhrase(ph);
                itemTable.addCell(cell);
            }

            for (var item : invoice.getItems()) {
                itemTable.addCell(cell(item.getProductName(), bodyFont, Element.ALIGN_LEFT));
                itemTable.addCell(cell(String.valueOf(item.getQuantity()), bodyFont, Element.ALIGN_CENTER));
                itemTable.addCell(cell("₹" + item.getUnitPrice(), bodyFont, Element.ALIGN_RIGHT));
                itemTable.addCell(cell(item.getTaxPercent() + "%", bodyFont, Element.ALIGN_CENTER));
                itemTable.addCell(cell("₹" + item.getLineTotal(), bodyFont, Element.ALIGN_RIGHT));
            }
            doc.add(itemTable);
            doc.add(Chunk.NEWLINE);

            // ── Totals ─────────────────────────────────────────────
            PdfPTable totals = new PdfPTable(2);
            totals.setWidthPercentage(45);
            totals.setHorizontalAlignment(Element.ALIGN_RIGHT);
            addTotalRow(totals, "Subtotal:",  "₹" + invoice.getSubtotal(),  bodyFont);
            addTotalRow(totals, "Tax:",       "₹" + invoice.getTotalTax(),  bodyFont);
            addTotalRow(totals, "Discount:",  "₹" + invoice.getDiscount(),  bodyFont);
            addTotalRow(totals, "Grand Total:", "₹" + invoice.getGrandTotal(), headerFont);
            doc.add(totals);

            // ── Footer ─────────────────────────────────────────────
            doc.add(Chunk.NEWLINE);
            Paragraph footer = new Paragraph("Thank you for your business!", smallFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            doc.add(footer);

            doc.close();
            log.info("PDF generated for invoice: {}", invoice.getInvoiceNumber());
            return out.toByteArray();

        } catch (Exception e) {
            log.error("PDF generation failed for invoice id: {}", invoiceId, e);
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    private void addMetaCell(PdfPTable table, String label, String value,
                             Font labelFont, Font valueFont) {
        PdfPCell lCell = new PdfPCell(new Phrase(label, labelFont));
        lCell.setBorder(Rectangle.NO_BORDER);
        lCell.setPadding(3);
        table.addCell(lCell);

        PdfPCell vCell = new PdfPCell(new Phrase(value != null ? value : "-", valueFont));
        vCell.setBorder(Rectangle.NO_BORDER);
        vCell.setPadding(3);
        table.addCell(vCell);
    }

    private PdfPCell cell(String text, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(alignment);
        cell.setPadding(5);
        return cell;
    }

    private void addTotalRow(PdfPTable table, String label, String value, Font font) {
        PdfPCell lCell = new PdfPCell(new Phrase(label, font));
        lCell.setBorder(Rectangle.NO_BORDER);
        lCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        lCell.setPadding(4);
        table.addCell(lCell);

        PdfPCell vCell = new PdfPCell(new Phrase(value, font));
        vCell.setBorder(Rectangle.NO_BORDER);
        vCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        vCell.setPadding(4);
        table.addCell(vCell);
    }
}
