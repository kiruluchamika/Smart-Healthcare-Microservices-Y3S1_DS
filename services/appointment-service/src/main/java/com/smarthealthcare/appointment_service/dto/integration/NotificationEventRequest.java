package com.smarthealthcare.appointment_service.dto.integration;

import java.time.LocalDateTime;

public record NotificationEventRequest(
        String eventType,
        String targetRole,
        Long targetUserId,
        Long paymentId,
        Long appointmentId,
        String title,
        String message,
        LocalDateTime scheduledFor) {
}