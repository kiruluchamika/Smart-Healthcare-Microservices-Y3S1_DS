package com.smarthealthcare.doctor_service.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class DoctorAvailabilityCreateRequest {

    @NotNull(message = "Day of week is required")
    private DayOfWeek dayOfWeek;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

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
}
