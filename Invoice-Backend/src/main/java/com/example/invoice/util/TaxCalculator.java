package com.example.invoice.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class TaxCalculator
{
    private TaxCalculator() {}

    public static BigDecimal calculateTaxAmount(BigDecimal price, BigDecimal taxPercent) {
        if (taxPercent == null || taxPercent.compareTo(BigDecimal.ZERO) == 0)
            return BigDecimal.ZERO;
        return price.multiply(taxPercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateLineTotal(BigDecimal unitPrice, int quantity) {
        return unitPrice.multiply(BigDecimal.valueOf(quantity))
                .setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateLineTax(BigDecimal unitPrice,
                                              BigDecimal taxPercent,
                                              int quantity) {
        BigDecimal taxPerUnit = calculateTaxAmount(unitPrice, taxPercent);
        return taxPerUnit.multiply(BigDecimal.valueOf(quantity))
                .setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateGrandTotal(BigDecimal subtotal,
                                                 BigDecimal totalTax,
                                                 BigDecimal discount) {
        BigDecimal d = discount != null ? discount : BigDecimal.ZERO;
        return subtotal.add(totalTax).subtract(d)
                .setScale(2, RoundingMode.HALF_UP);
    }
}
