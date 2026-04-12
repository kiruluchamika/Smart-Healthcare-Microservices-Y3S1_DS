package com.smarthealthcare.telemedicine_service.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.smarthealthcare.telemedicine_service.entity.TelemedicineSession;
import com.smarthealthcare.telemedicine_service.entity.TelemedicineSessionStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TelemedicineSessionResponse(
        String sessionId,
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
        String reasonForVisit,
        String roomId,
        String meetingUrl,
        String sessionUrl,
        String provider,
        String status,
        LocalDateTime createdAt,
        LocalDateTime startedAt,
        LocalDateTime completedAt,
        String consultationSummary,
        boolean joinAllowed) {

    public static TelemedicineSessionResponse fromEntity(TelemedicineSession session) {
        boolean joinAllowed = session.getStatus() != null
                && session.getStatus() != TelemedicineSessionStatus.COMPLETED;
        String meetingUrl = joinAllowed ? session.getMeetingUrl() : null;

        return new TelemedicineSessionResponse(
                String.valueOf(session.getId()),
                session.getPaymentId(),
                session.getAppointmentId(),
                session.getPatientId(),
                session.getDoctorId(),
                session.getAppointmentDate(),
                session.getStartTime(),
                session.getEndTime(),
                session.getAppointmentType(),
                session.getAmount(),
                session.getCurrency(),
                session.getReasonForVisit(),
                session.getRoomId(),
                meetingUrl,
                meetingUrl,
                "JITSI",
                session.getStatus().name(),
                session.getCreatedAt(),
                session.getStartedAt(),
                session.getCompletedAt(),
                session.getConsultationSummary(),
                joinAllowed);
    }
}
