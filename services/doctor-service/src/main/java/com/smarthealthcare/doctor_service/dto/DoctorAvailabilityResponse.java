package com.smarthealthcare.doctor_service.dto;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class DoctorAvailabilityResponse {
    Long id;
    Long doctorId;
    DayOfWeek dayOfWeek;
    List<DayOfWeek> daysOfWeek;
    LocalTime startTime;
    LocalTime endTime;
    Integer slotDuration;
    Boolean isAvailable;
    LocalDate effectiveFrom;
    LocalDate effectiveTo;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
