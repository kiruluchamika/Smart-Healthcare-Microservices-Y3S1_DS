package com.smarthealthcare.payment_service.exception;

import java.time.Instant;
import java.util.Map;

public record ApiErrorResponse(String message, Map<String, String> errors, Instant timestamp) {
}