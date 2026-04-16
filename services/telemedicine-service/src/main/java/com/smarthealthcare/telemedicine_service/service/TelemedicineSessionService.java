package com.smarthealthcare.telemedicine_service.service;

import com.smarthealthcare.telemedicine_service.dto.request.CompleteTelemedicineSessionRequest;
import com.smarthealthcare.telemedicine_service.dto.request.CreateTelemedicineSessionRequest;
import com.smarthealthcare.telemedicine_service.dto.response.TelemedicineSessionResponse;
import java.util.List;

public interface TelemedicineSessionService {

    TelemedicineSessionResponse createSession(CreateTelemedicineSessionRequest request);

    TelemedicineSessionResponse getSessionByAppointmentId(Long appointmentId);

    List<TelemedicineSessionResponse> getSessionsByPatientId(Long patientId);

    List<TelemedicineSessionResponse> getSessionsByDoctorId(Long doctorId);

    List<TelemedicineSessionResponse> getAllSessions();

    TelemedicineSessionResponse startSession(Long sessionId);

    TelemedicineSessionResponse completeSession(Long sessionId, CompleteTelemedicineSessionRequest request);
}
