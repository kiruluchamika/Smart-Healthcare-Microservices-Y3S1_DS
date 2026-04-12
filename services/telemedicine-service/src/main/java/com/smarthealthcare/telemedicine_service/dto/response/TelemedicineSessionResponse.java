package com.smarthealthcare.telemedicine_service.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.smarthealthcare.telemedicine_service.entity.TelemedicineSession;
import java.time.LocalDateTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TelemedicineSessionResponse(
        String sessionId,
        Long appointmentId,
        String roomId,
        String meetingUrl,
        String sessionUrl,
        String provider,
        String status,
        LocalDateTime createdAt) {

    public static TelemedicineSessionResponse fromEntity(TelemedicineSession session) {
        String meetingUrl = session.getMeetingUrl();
        return new TelemedicineSessionResponse(
                String.valueOf(session.getId()),
                session.getAppointmentId(),
                session.getRoomId(),
                meetingUrl,
                meetingUrl,
                "JITSI",
                session.getStatus().name(),
                session.getCreatedAt());
    }
}