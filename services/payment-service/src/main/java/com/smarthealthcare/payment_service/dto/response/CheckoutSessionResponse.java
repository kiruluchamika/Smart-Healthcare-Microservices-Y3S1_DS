package com.smarthealthcare.payment_service.dto.response;

import com.smarthealthcare.payment_service.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CheckoutSessionResponse(
        Long paymentId,
        Long appointmentId,
        Long patientId,
        Long doctorId,
        BigDecimal amount,
        String currency,
        PaymentStatus status,
        String checkoutSessionId,
        String checkoutUrl,
        String telemedicineSessionUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}