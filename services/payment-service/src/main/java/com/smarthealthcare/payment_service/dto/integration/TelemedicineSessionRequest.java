package com.smarthealthcare.payment_service.dto.integration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record TelemedicineSessionRequest(
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
        String reasonForVisit) {
}