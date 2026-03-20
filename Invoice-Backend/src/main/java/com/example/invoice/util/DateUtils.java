package com.example.invoice.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class DateUtils
{
    private DateUtils() {}

    public static LocalDateTime startOfDay(LocalDate date) {
        return date.atStartOfDay();
    }

    public static LocalDateTime endOfDay(LocalDate date) {
        return date.atTime(LocalTime.MAX);
    }

    public static LocalDateTime startOfMonth(LocalDate date) {
        return date.withDayOfMonth(1).atStartOfDay();
    }

    public static LocalDateTime endOfMonth(LocalDate date) {
        return date.withDayOfMonth(date.lengthOfMonth()).atTime(LocalTime.MAX);
    }

    public static LocalDateTime startOfToday() {
        return startOfDay(LocalDate.now());
    }

    public static LocalDateTime endOfToday() {
        return endOfDay(LocalDate.now());
    }
}
