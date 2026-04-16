package com.smarthealthcare.doctor_service.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DoctorAvailabilityCreateRequest {

    private DayOfWeek dayOfWeek;

    private List<DayOfWeek> daysOfWeek;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @NotNull(message = "Slot duration is required")
    private Integer slotDuration;

    @NotNull(message = "Availability flag is required")
    private Boolean isAvailable;

    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;

    @AssertTrue(message = "Start time must be before end time")
    public boolean isTimeRangeValid() {
        if (startTime == null || endTime == null) {
            return true;
        }
        return startTime.isBefore(endTime);
    }

    @AssertTrue(message = "effectiveFrom must be on or before effectiveTo")
    public boolean isDateRangeValid() {
        if (effectiveFrom == null || effectiveTo == null) {
            return true;
        }
        return !effectiveFrom.isAfter(effectiveTo);
    }

    @AssertTrue(message = "Slot duration must be one of 15, 30, 45, or 60 minutes")
    public boolean isSlotDurationValid() {
        if (slotDuration == null) {
            return true;
        }

        return slotDuration == 15 || slotDuration == 30 || slotDuration == 45 || slotDuration == 60;
    }

    @AssertTrue(message = "At least one day of week is required")
    public boolean isDaysOfWeekValid() {
        return (daysOfWeek != null && !daysOfWeek.isEmpty()) || dayOfWeek != null;
    }
}
