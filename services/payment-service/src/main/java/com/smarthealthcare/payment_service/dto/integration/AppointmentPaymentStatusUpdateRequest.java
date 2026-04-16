package com.smarthealthcare.payment_service.dto.integration;

import java.time.LocalDateTime;

public record AppointmentPaymentStatusUpdateRequest(
        String paymentStatus,
        LocalDateTime paidAt,
        String telemedicineSessionUrl) {
}
