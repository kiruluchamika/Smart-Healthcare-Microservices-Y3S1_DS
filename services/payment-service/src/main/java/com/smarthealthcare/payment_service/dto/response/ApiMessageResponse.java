package com.smarthealthcare.payment_service.dto.response;

import java.time.Instant;

public record ApiMessageResponse(String message, Instant timestamp) {

    public static ApiMessageResponse of(String message) {
        return new ApiMessageResponse(message, Instant.now());
    }
}