package com.smarthealthcare.payment_service.dto.integration;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AppointmentSnapshot(
        Long id,
        Long patientId,
        Long doctorId,
        LocalDate appointmentDate,
        LocalTime startTime,
        LocalTime endTime,
        String appointmentType,
        String status,
        String reasonForVisit,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}