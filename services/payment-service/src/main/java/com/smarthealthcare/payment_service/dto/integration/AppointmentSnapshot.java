package com.smarthealthcare.payment_service.dto.integration;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AppointmentSnapshot(
        Long id,
        Long patientId,
        Long doctorId,
        LocalDate appointmentDate,
        LocalTime startTime,
        LocalTime endTime,
        String appointmentType,
        String status,
        String reasonForVisit,
        BigDecimal fixedFeeSnapshot,
        BigDecimal doctorExtraFee,
        BigDecimal finalFee,
        String feeCurrency,
        String paymentStatusHint,
        LocalDateTime paymentPaidAt,
        String telemedicineSessionUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}