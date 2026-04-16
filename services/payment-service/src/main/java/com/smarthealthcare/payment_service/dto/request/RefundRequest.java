package com.smarthealthcare.payment_service.dto.request;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record RefundRequest(
        @Size(max = 500) String reason,
        BigDecimal amount) {
}