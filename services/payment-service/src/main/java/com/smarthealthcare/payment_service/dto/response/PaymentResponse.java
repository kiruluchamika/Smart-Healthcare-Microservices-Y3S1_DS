package com.smarthealthcare.payment_service.dto.response;

import com.smarthealthcare.payment_service.entity.PaymentProvider;
import com.smarthealthcare.payment_service.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record PaymentResponse(
        Long paymentId,
        Long appointmentId,
        Long patientId,
        Long doctorId,
        LocalDate appointmentDate,
        LocalTime startTime,
        LocalTime endTime,
        String appointmentType,
        BigDecimal amount,
        String currency,
        PaymentStatus status,
        PaymentProvider provider,
        String checkoutSessionId,
        String paymentIntentId,
        String refundId,
        String checkoutUrl,
        String telemedicineSessionId,
        String telemedicineSessionUrl,
        String failureReason,
        String refundReason,
        boolean reminderSent,
        LocalDateTime paidAt,
        LocalDateTime refundedAt,
        LocalDateTime completedAt,
        LocalDateTime reminderSentAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}