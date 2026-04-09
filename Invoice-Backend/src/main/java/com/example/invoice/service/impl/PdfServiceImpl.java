package com.example.invoice.service.impl;

import com.example.invoice.config.BusinessProperties;
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
public class PdfServiceImpl implements PdfService {

    private final InvoiceRepository invoiceRepository;
    private final BusinessProperties business;   // ← injected from application.properties

    // ── Brand Colors ───────────────────────────────────────────────────────────
    private static final BaseColor GREEN       = new BaseColor(0, 200, 83);
    private static final BaseColor BORDER_GRAY = new BaseColor(200, 200, 200);

    @Override
    public byte[] generateInvoicePdf(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(doc, out);
            doc.open();

            // ── Fonts ──────────────────────────────────────────────────────────
            Font companyFont  = new Font(Font.FontFamily.HELVETICA, 22, Font.BOLD,   GREEN);
            Font headingFont  = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD,   BaseColor.BLACK);
            Font subFont      = new Font(Font.FontFamily.HELVETICA,  9, Font.NORMAL, BaseColor.BLACK);
            Font smallFont    = new Font(Font.FontFamily.HELVETICA,  8, Font.NORMAL, BaseColor.DARK_GRAY);
            Font boldSmall    = new Font(Font.FontFamily.HELVETICA,  8, Font.BOLD,   BaseColor.BLACK);
            Font tableHeader  = new Font(Font.FontFamily.HELVETICA,  9, Font.BOLD,   BaseColor.WHITE);
            Font tableBody    = new Font(Font.FontFamily.HELVETICA,  9, Font.NORMAL, BaseColor.BLACK);
            Font grandFont    = new Font(Font.FontFamily.HELVETICA,  9, Font.BOLD,   BaseColor.WHITE);
            Font titleFont    = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD,   BaseColor.BLACK);

            // ── TAX INVOICE heading ────────────────────────────────────────────
            Paragraph taxLabel = new Paragraph("TAX INVOICE", titleFont);
            taxLabel.setAlignment(Element.ALIGN_LEFT);
            taxLabel.setSpacingAfter(4);
            doc.add(taxLabel);

            // ── Outer box ─────────────────────────────────────────────────────
            PdfPTable outerBox = new PdfPTable(1);
            outerBox.setWidthPercentage(100);

            // Company header
            PdfPTable headerTable = new PdfPTable(1);
            headerTable.setWidthPercentage(100);

            // Business name from application.properties ← KEY FIX
            PdfPCell companyCell = new PdfPCell(new Phrase(business.getName(), companyFont));
            companyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            companyCell.setBorder(Rectangle.NO_BORDER);
            companyCell.setPaddingTop(10);
            companyCell.setPaddingBottom(2);
            headerTable.addCell(companyCell);

            // Address
            PdfPCell addrCell = new PdfPCell(new Phrase(nvl(business.getAddress()), subFont));
            addrCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            addrCell.setBorder(Rectangle.NO_BORDER);
            addrCell.setPaddingBottom(6);
            headerTable.addCell(addrCell);

            // Phone | GSTIN | PAN row
            PdfPTable infoRow = new PdfPTable(3);
            infoRow.setWidthPercentage(100);
            infoRow.setWidths(new float[]{1f, 1f, 1f});
            addInfoCell(infoRow, "Phone: " + nvl(business.getPhone()),   boldSmall, Element.ALIGN_LEFT);
            addInfoCell(infoRow, "GSTIN: " + nvl(business.getGstin()),   boldSmall, Element.ALIGN_CENTER);
            addInfoCell(infoRow, "PAN Number: " + nvl(business.getPan()), boldSmall, Element.ALIGN_RIGHT);

            PdfPCell infoWrapCell = new PdfPCell(infoRow);
            infoWrapCell.setBorder(Rectangle.NO_BORDER);
            infoWrapCell.setPaddingBottom(8);
            headerTable.addCell(infoWrapCell);

            PdfPCell outerHeaderCell = new PdfPCell(headerTable);
            outerHeaderCell.setBorder(Rectangle.BOX);
            outerHeaderCell.setBorderColor(BORDER_GRAY);
            outerHeaderCell.setPadding(0);
            outerBox.addCell(outerHeaderCell);

            // ── Bill To + Invoice Meta ─────────────────────────────────────────
            PdfPTable billMetaTable = new PdfPTable(2);
            billMetaTable.setWidthPercentage(100);
            billMetaTable.setWidths(new float[]{1.2f, 1f});

            // BILL TO
            PdfPTable billToInner = new PdfPTable(1);
            billToInner.setWidthPercentage(100);

            PdfPCell billToLabel = new PdfPCell(new Phrase("BILL TO", boldSmall));
            billToLabel.setBorder(Rectangle.NO_BORDER);
            billToLabel.setPaddingTop(8);
            billToLabel.setPaddingLeft(6);
            billToInner.addCell(billToLabel);

            String custName = invoice.getCustomer().getName() != null
                    ? invoice.getCustomer().getName() : "Walk-in Customer";
            PdfPCell custNameCell = new PdfPCell(new Phrase(custName, headingFont));
            custNameCell.setBorder(Rectangle.NO_BORDER);
            custNameCell.setPaddingLeft(6);
            billToInner.addCell(custNameCell);

            String[] custLines = {
                    nvl(invoice.getCustomer().getAddress()),
                    "Phone:  " + nvl(invoice.getCustomer().getMobileNumber()),
                    "PAN Number:  " ,
                    "GSTIN:  ",
                    "Place of Supply: "
            };
            for (String line : custLines) {
                PdfPCell lc = new PdfPCell(new Phrase(line, smallFont));
                lc.setBorder(Rectangle.NO_BORDER);
                lc.setPaddingLeft(6);
                lc.setPaddingBottom(1);
                billToInner.addCell(lc);
            }
            PdfPCell billToWrap = new PdfPCell(billToInner);
            billToWrap.setBorder(Rectangle.BOX);
            billToWrap.setBorderColor(BORDER_GRAY);
            billToWrap.setPadding(0);
            billMetaTable.addCell(billToWrap);

            // Invoice meta (No, Date, Payment, Status)
            PdfPTable invoiceMetaInner = new PdfPTable(2);
            invoiceMetaInner.setWidthPercentage(100);
            invoiceMetaInner.setWidths(new float[]{1f, 1f});

            String[][] metaRows = {
                    {"Invoice No",    invoice.getInvoiceNumber()},
                    {"Invoice Date",  invoice.getCreatedAt().toLocalDate().toString()},
                    {"Payment Mode",  invoice.getPaymentMode().name()},
                    {"Status",        invoice.getStatus().name()},
            };
            for (String[] row : metaRows) {
                PdfPCell k = new PdfPCell(new Phrase(row[0], boldSmall));
                k.setBorder(Rectangle.NO_BORDER); k.setPadding(4);
                invoiceMetaInner.addCell(k);
                PdfPCell v = new PdfPCell(new Phrase(row[1], smallFont));
                v.setBorder(Rectangle.NO_BORDER); v.setPadding(4);
                invoiceMetaInner.addCell(v);
            }
            PdfPCell metaWrap = new PdfPCell(invoiceMetaInner);
            metaWrap.setBorder(Rectangle.BOX);
            metaWrap.setBorderColor(BORDER_GRAY);
            metaWrap.setPadding(0);
            metaWrap.setVerticalAlignment(Element.ALIGN_TOP);
            billMetaTable.addCell(metaWrap);

            PdfPCell billMetaWrapCell = new PdfPCell(billMetaTable);
            billMetaWrapCell.setBorder(Rectangle.BOX);
            billMetaWrapCell.setBorderColor(BORDER_GRAY);
            billMetaWrapCell.setPadding(0);
            outerBox.addCell(billMetaWrapCell);
            doc.add(outerBox);

            // ── Items Table ────────────────────────────────────────────────────
            PdfPTable itemTable = new PdfPTable(6);
            itemTable.setWidthPercentage(100);
            itemTable.setWidths(new float[]{0.5f, 2.5f, 1f, 1.2f, 1.2f, 1.2f});

            String[] colHeaders = {"Sr. No.", "Items", "Quantity", "Price / Unit", "Tax / Unit", "Amount"};
            for (String h : colHeaders) {
                PdfPCell hc = new PdfPCell(new Phrase(h, tableHeader));
                hc.setBackgroundColor(GREEN);
                hc.setHorizontalAlignment(Element.ALIGN_CENTER);
                hc.setVerticalAlignment(Element.ALIGN_MIDDLE);
                hc.setPadding(6);
                hc.setBorderColor(BORDER_GRAY);
                itemTable.addCell(hc);
            }

            int srNo = 1;
            for (var item : invoice.getItems()) {
                java.math.BigDecimal taxAmt = item.getUnitPrice()
                        .multiply(item.getTaxPercent())
                        .divide(java.math.BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);

                itemTable.addCell(itemCell(String.valueOf(srNo++), tableBody, Element.ALIGN_CENTER));
                itemTable.addCell(itemCell(item.getProductName(), tableBody, Element.ALIGN_LEFT));
                itemTable.addCell(itemCell(String.valueOf(item.getQuantity()), tableBody, Element.ALIGN_CENTER));
                itemTable.addCell(itemCell("Rs. " + item.getUnitPrice(), tableBody, Element.ALIGN_CENTER));
                itemTable.addCell(itemCell("Rs. " + taxAmt + " (" + item.getTaxPercent() + "%)", tableBody, Element.ALIGN_CENTER));
                itemTable.addCell(itemCell("Rs. " + item.getLineTotal(), tableBody, Element.ALIGN_RIGHT));
            }

            // Fill empty rows (min 8 total)
            int minRows = 8;
            for (int i = invoice.getItems().size(); i < minRows; i++) {
                for (int j = 0; j < 6; j++) {
                    PdfPCell ec = new PdfPCell(new Phrase(" ", tableBody));
                    ec.setPadding(10); ec.setBorderColor(BORDER_GRAY);
                    itemTable.addCell(ec);
                }
            }

            // Discount row
            PdfPCell discLabel = new PdfPCell(new Phrase("Discount", tableBody));
            discLabel.setColspan(5); discLabel.setHorizontalAlignment(Element.ALIGN_RIGHT);
            discLabel.setPadding(6); discLabel.setBorderColor(BORDER_GRAY);
            itemTable.addCell(discLabel);
            PdfPCell discVal = new PdfPCell(new Phrase("Rs. " + invoice.getDiscount(), tableBody));
            discVal.setHorizontalAlignment(Element.ALIGN_RIGHT);
            discVal.setPadding(6); discVal.setBorderColor(BORDER_GRAY);
            itemTable.addCell(discVal);

            // Total row (green)
            int totalQty = invoice.getItems().stream().mapToInt(i -> i.getQuantity()).sum();
            PdfPCell totalLabel = new PdfPCell(new Phrase("Total", grandFont));
            totalLabel.setBackgroundColor(GREEN); totalLabel.setPadding(6);
            totalLabel.setHorizontalAlignment(Element.ALIGN_RIGHT); totalLabel.setBorderColor(BORDER_GRAY);
            itemTable.addCell(totalLabel);

            PdfPCell totalQtyCell = new PdfPCell(new Phrase(String.valueOf(totalQty), grandFont));
            totalQtyCell.setBackgroundColor(GREEN); totalQtyCell.setPadding(6);
            totalQtyCell.setHorizontalAlignment(Element.ALIGN_CENTER); totalQtyCell.setBorderColor(BORDER_GRAY);
            itemTable.addCell(totalQtyCell);

            PdfPCell totalEmpty = new PdfPCell(new Phrase("", grandFont));
            totalEmpty.setBackgroundColor(GREEN); totalEmpty.setColspan(2);
            totalEmpty.setPadding(6); totalEmpty.setBorderColor(BORDER_GRAY);
            itemTable.addCell(totalEmpty);

            PdfPCell totalTaxCell = new PdfPCell(new Phrase("Rs. " + invoice.getTotalTax(), grandFont));
            totalTaxCell.setBackgroundColor(GREEN); totalTaxCell.setPadding(6);
            totalTaxCell.setHorizontalAlignment(Element.ALIGN_CENTER); totalTaxCell.setBorderColor(BORDER_GRAY);
            itemTable.addCell(totalTaxCell);

            PdfPCell totalAmt = new PdfPCell(new Phrase("Rs. " + invoice.getGrandTotal(), grandFont));
            totalAmt.setBackgroundColor(GREEN); totalAmt.setPadding(6);
            totalAmt.setHorizontalAlignment(Element.ALIGN_RIGHT); totalAmt.setBorderColor(BORDER_GRAY);
            itemTable.addCell(totalAmt);

            // Received Amount row
            java.math.BigDecimal received = invoice.getReceivedAmount() != null
                    ? invoice.getReceivedAmount() : java.math.BigDecimal.ZERO;
            PdfPCell rcvLabel = new PdfPCell(new Phrase("Received Amount", boldSmall));
            rcvLabel.setColspan(5); rcvLabel.setHorizontalAlignment(Element.ALIGN_RIGHT);
            rcvLabel.setPadding(6); rcvLabel.setBorderColor(BORDER_GRAY);
            itemTable.addCell(rcvLabel);
            PdfPCell rcvAmt = new PdfPCell(new Phrase("Rs. " + received, tableBody));
            rcvAmt.setHorizontalAlignment(Element.ALIGN_RIGHT);
            rcvAmt.setPadding(6); rcvAmt.setBorderColor(BORDER_GRAY);
            itemTable.addCell(rcvAmt);

            // Due Balance row
            java.math.BigDecimal due = invoice.getGrandTotal().subtract(received);
            PdfPCell dueLabel = new PdfPCell(new Phrase("Due Balance", headingFont));
            dueLabel.setColspan(5); dueLabel.setHorizontalAlignment(Element.ALIGN_RIGHT);
            dueLabel.setPadding(6); dueLabel.setBorderColor(BORDER_GRAY);
            itemTable.addCell(dueLabel);
            PdfPCell dueAmt = new PdfPCell(new Phrase("Rs. " + due, headingFont));
            dueAmt.setHorizontalAlignment(Element.ALIGN_RIGHT);
            dueAmt.setPadding(6); dueAmt.setBorderColor(BORDER_GRAY);
            itemTable.addCell(dueAmt);

            doc.add(itemTable);

            // ── Footer: Notes | Terms | Signature ─────────────────────────────
            PdfPTable footerTable = new PdfPTable(3);
            footerTable.setWidthPercentage(100);
            footerTable.setWidths(new float[]{1f, 1.3f, 1f});

            // Notes
            PdfPTable notesInner = new PdfPTable(1);
            notesInner.setWidthPercentage(100);
            PdfPCell notesTitle = new PdfPCell(new Phrase("Notes", boldSmall));
            notesTitle.setBorder(Rectangle.NO_BORDER); notesTitle.setPadding(4);
            notesInner.addCell(notesTitle);
            String notesText = invoice.getNotes() != null && !invoice.getNotes().isBlank()
                    ? invoice.getNotes() : "1. No return deal";
            for (String line : notesText.split("\n")) {
                PdfPCell nl = new PdfPCell(new Phrase(line, smallFont));
                nl.setBorder(Rectangle.NO_BORDER); nl.setPaddingLeft(4); nl.setPaddingBottom(2);
                notesInner.addCell(nl);
            }
            PdfPCell notesWrap = new PdfPCell(notesInner);
            notesWrap.setBorder(Rectangle.BOX); notesWrap.setBorderColor(BORDER_GRAY);
            notesWrap.setPadding(0); notesWrap.setFixedHeight(80);
            footerTable.addCell(notesWrap);

            // Terms & Conditions
            PdfPTable termsInner = new PdfPTable(1);
            termsInner.setWidthPercentage(100);
            PdfPCell termsTitle = new PdfPCell(new Phrase("Terms & Conditions", boldSmall));
            termsTitle.setBorder(Rectangle.NO_BORDER); termsTitle.setPadding(4);
            termsInner.addCell(termsTitle);
            String[] terms = {
                    "1. Customer will pay the GST",
                    "2. Customer will pay the Delivery charges",
                    "3. Pay due amount within 15 days"
            };
            for (String t : terms) {
                PdfPCell tc = new PdfPCell(new Phrase(t, smallFont));
                tc.setBorder(Rectangle.NO_BORDER); tc.setPaddingLeft(4); tc.setPaddingBottom(2);
                termsInner.addCell(tc);
            }
            PdfPCell termsWrap = new PdfPCell(termsInner);
            termsWrap.setBorder(Rectangle.BOX); termsWrap.setBorderColor(BORDER_GRAY);
            termsWrap.setPadding(0); termsWrap.setFixedHeight(80);
            footerTable.addCell(termsWrap);

            // ── Signature cell ← KEY FIX ──────────────────────────────────────
            PdfPTable sigInner = new PdfPTable(1);
            sigInner.setWidthPercentage(100);

            if (invoice.getSignatureImage() != null && invoice.getSignatureImage().length > 0) {
                try {
                    Image sigImg = Image.getInstance(invoice.getSignatureImage());
                    sigImg.scaleToFit(130, 45);
                    sigImg.setAlignment(Element.ALIGN_CENTER);
                    PdfPCell imgCell = new PdfPCell(sigImg);
                    imgCell.setBorder(Rectangle.NO_BORDER);
                    imgCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    imgCell.setPaddingTop(6);
                    sigInner.addCell(imgCell);
                    log.info("Signature image embedded in PDF for invoice: {}", invoice.getInvoiceNumber());
                } catch (Exception ex) {
                    log.warn("Could not embed signature image in PDF: {}", ex.getMessage());
                    addSigSpacer(sigInner, smallFont);
                }
            } else {
                log.info("No signature image for invoice: {}", invoice.getInvoiceNumber());
                addSigSpacer(sigInner, smallFont);
            }

            // "Authorised Signatory For <BusinessName>" — uses application.properties
            PdfPCell sigLabel = new PdfPCell(
                    new Phrase("Authorised Signatory For\n" + business.getName(), boldSmall));
            sigLabel.setBorder(Rectangle.NO_BORDER);
            sigLabel.setHorizontalAlignment(Element.ALIGN_CENTER);
            sigLabel.setVerticalAlignment(Element.ALIGN_BOTTOM);
            sigLabel.setPaddingBottom(6);
            sigInner.addCell(sigLabel);

            PdfPCell sigWrap = new PdfPCell(sigInner);
            sigWrap.setBorder(Rectangle.BOX); sigWrap.setBorderColor(BORDER_GRAY);
            sigWrap.setPadding(0); sigWrap.setFixedHeight(80);
            footerTable.addCell(sigWrap);

            doc.add(footerTable);
            doc.close();

            log.info("PDF generated for invoice: {}", invoice.getInvoiceNumber());
            return out.toByteArray();

        } catch (Exception e) {
            log.error("PDF generation failed for invoice id: {}", invoiceId, e);
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private void addSigSpacer(PdfPTable table, Font font) {
        PdfPCell spacer = new PdfPCell(new Phrase(" ", font));
        spacer.setBorder(Rectangle.NO_BORDER);
        spacer.setFixedHeight(36);
        table.addCell(spacer);
    }

    private void addInfoCell(PdfPTable table, String text, Font font, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(align);
        cell.setPaddingBottom(6);
        cell.setPaddingLeft(6);
        cell.setPaddingRight(6);
        table.addCell(cell);
    }

    private PdfPCell itemCell(String text, Font font, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "-", font));
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(5);
        cell.setBorderColor(BORDER_GRAY);
        return cell;
    }

    private String nvl(String val) {
        return val != null && !val.isBlank() ? val : "-";
    }
}