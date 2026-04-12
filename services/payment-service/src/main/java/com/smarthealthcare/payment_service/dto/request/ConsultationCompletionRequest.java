package com.smarthealthcare.payment_service.dto.request;

import jakarta.validation.constraints.Size;

public record ConsultationCompletionRequest(
        @Size(max = 1000) String summary) {
}