package com.smarthealthcare.payment_service.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateCheckoutSessionRequest(
        @NotNull @Positive Long appointmentId,
        String successUrl,
        String cancelUrl) {
}