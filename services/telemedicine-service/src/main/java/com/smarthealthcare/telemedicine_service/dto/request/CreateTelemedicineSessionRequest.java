package com.smarthealthcare.telemedicine_service.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CreateTelemedicineSessionRequest(
        @NotNull(message = "Appointment ID is required")
        @Positive(message = "Appointment ID must be positive")
        Long appointmentId) {
}