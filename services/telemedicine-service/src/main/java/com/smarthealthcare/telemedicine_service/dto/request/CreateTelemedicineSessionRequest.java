package com.smarthealthcare.telemedicine_service.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CreateTelemedicineSessionRequest(
        @NotNull(message = "Appointment ID is required")
        @Positive(message = "Appointment ID must be positive")
        Long appointmentId,
        @Positive(message = "Payment ID must be positive")
        Long paymentId,
        @Positive(message = "Patient ID must be positive")
        Long patientId,
        @Positive(message = "Doctor ID must be positive")
        Long doctorId,
        LocalDate appointmentDate,
        LocalTime startTime,
        LocalTime endTime,
        @Size(max = 32, message = "Appointment type cannot exceed 32 characters")
        String appointmentType,
        @DecimalMin(value = "0.0", inclusive = true, message = "Amount must be non-negative")
        BigDecimal amount,
        @Size(max = 8, message = "Currency cannot exceed 8 characters")
        String currency,
        @Size(max = 1000, message = "Reason for visit cannot exceed 1000 characters")
        String reasonForVisit) {
}
