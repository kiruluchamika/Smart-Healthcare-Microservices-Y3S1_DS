package com.smarthealthcare.payment_service.dto.integration;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TelemedicineSessionResponse(
        String sessionId,
        String sessionUrl,
        String provider,
        String status) {
}