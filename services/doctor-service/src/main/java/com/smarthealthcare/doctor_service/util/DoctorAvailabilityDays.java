package com.smarthealthcare.doctor_service.util;

import java.time.DayOfWeek;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public final class DoctorAvailabilityDays {

    private DoctorAvailabilityDays() {
    }

    public static List<DayOfWeek> parse(String serializedDays) {
        if (serializedDays == null || serializedDays.isBlank()) {
            return List.of();
        }

        return java.util.Arrays.stream(serializedDays.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .map(DayOfWeek::valueOf)
                .distinct()
                .sorted(Comparator.naturalOrder())
                .toList();
    }

    public static String serialize(List<DayOfWeek> daysOfWeek) {
        return daysOfWeek.stream()
                .sorted(Comparator.naturalOrder())
                .map(DayOfWeek::name)
                .distinct()
                .reduce((left, right) -> left + "," + right)
                .orElseThrow(() -> new IllegalArgumentException("At least one day of week is required"));
    }

    public static List<DayOfWeek> resolveRequestedDays(List<DayOfWeek> daysOfWeek, DayOfWeek legacyDayOfWeek) {
        Set<DayOfWeek> resolved = new LinkedHashSet<>();
        if (daysOfWeek != null) {
            resolved.addAll(daysOfWeek);
        }
        if (legacyDayOfWeek != null) {
            resolved.add(legacyDayOfWeek);
        }
        return resolved.stream()
                .sorted(Comparator.naturalOrder())
                .toList();
    }

    public static boolean containsDay(String serializedDays, DayOfWeek dayOfWeek) {
        return parse(serializedDays).contains(dayOfWeek);
    }

    public static boolean intersects(String leftDays, String rightDays) {
        List<DayOfWeek> left = parse(leftDays);
        if (left.isEmpty()) {
            return false;
        }

        Set<DayOfWeek> right = new LinkedHashSet<>(parse(rightDays));
        return left.stream().anyMatch(right::contains);
    }
}
