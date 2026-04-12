package com.smarthealthcare.telemedicine_service.service;

import com.smarthealthcare.telemedicine_service.dto.request.CreateTelemedicineSessionRequest;
import com.smarthealthcare.telemedicine_service.dto.response.TelemedicineSessionResponse;

public interface TelemedicineSessionService {

    TelemedicineSessionResponse createSession(CreateTelemedicineSessionRequest request);

    TelemedicineSessionResponse getSessionByAppointmentId(Long appointmentId);

    TelemedicineSessionResponse startSession(Long sessionId);

    TelemedicineSessionResponse completeSession(Long sessionId);
}