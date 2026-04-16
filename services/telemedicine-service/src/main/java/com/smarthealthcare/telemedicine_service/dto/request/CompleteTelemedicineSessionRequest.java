package com.smarthealthcare.telemedicine_service.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CompleteTelemedicineSessionRequest(
        @Size(max = 2000, message = "Consultation summary cannot exceed 2000 characters")
        String consultationSummary) {
}
