package com.smarthealthcare.telemedicine_service.service.impl;

import com.smarthealthcare.telemedicine_service.dto.request.CreateTelemedicineSessionRequest;
import com.smarthealthcare.telemedicine_service.dto.response.TelemedicineSessionResponse;
import com.smarthealthcare.telemedicine_service.entity.TelemedicineSession;
import com.smarthealthcare.telemedicine_service.entity.TelemedicineSessionStatus;
import com.smarthealthcare.telemedicine_service.exception.ConflictException;
import com.smarthealthcare.telemedicine_service.exception.ResourceNotFoundException;
import com.smarthealthcare.telemedicine_service.repository.TelemedicineSessionRepository;
import com.smarthealthcare.telemedicine_service.service.TelemedicineSessionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class TelemedicineSessionServiceImpl implements TelemedicineSessionService {

    private static final String ROOM_PREFIX = "appointment-";
    private static final String MEETING_BASE_URL = "https://meet.jit.si";

    private final TelemedicineSessionRepository repository;

    public TelemedicineSessionServiceImpl(TelemedicineSessionRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public TelemedicineSessionResponse createSession(CreateTelemedicineSessionRequest request) {
        Long appointmentId = request.appointmentId();
        if (appointmentId == null) {
            throw new ConflictException("Appointment ID is required");
        }

        TelemedicineSession existingSession = repository.findByAppointmentId(appointmentId).orElse(null);
        if (existingSession != null) {
            return TelemedicineSessionResponse.fromEntity(existingSession);
        }

        TelemedicineSession session = new TelemedicineSession();
        session.setAppointmentId(appointmentId);
        session.setRoomId(buildRoomId(appointmentId));
        session.setMeetingUrl(buildMeetingUrl(session.getRoomId()));
        session.setStatus(TelemedicineSessionStatus.CREATED);

        return TelemedicineSessionResponse.fromEntity(repository.save(session));
    }

    @Override
    @Transactional(readOnly = true)
    public TelemedicineSessionResponse getSessionByAppointmentId(Long appointmentId) {
        return TelemedicineSessionResponse.fromEntity(findSessionByAppointmentId(appointmentId));
    }

    @Override
    @Transactional
    public TelemedicineSessionResponse startSession(Long sessionId) {
        TelemedicineSession session = findSessionById(sessionId);
        if (session.getStatus() == TelemedicineSessionStatus.STARTED) {
            return TelemedicineSessionResponse.fromEntity(session);
        }
        if (session.getStatus() == TelemedicineSessionStatus.COMPLETED) {
            throw new ConflictException("Session has already been completed");
        }

        session.setStatus(TelemedicineSessionStatus.STARTED);
        return TelemedicineSessionResponse.fromEntity(repository.save(session));
    }

    @Override
    @Transactional
    public TelemedicineSessionResponse completeSession(Long sessionId) {
        TelemedicineSession session = findSessionById(sessionId);
        if (session.getStatus() == TelemedicineSessionStatus.COMPLETED) {
            return TelemedicineSessionResponse.fromEntity(session);
        }
        if (session.getStatus() != TelemedicineSessionStatus.STARTED) {
            throw new ConflictException("Session must be started before it can be completed");
        }

        session.setStatus(TelemedicineSessionStatus.COMPLETED);
        return TelemedicineSessionResponse.fromEntity(repository.save(session));
    }

    private TelemedicineSession findSessionByAppointmentId(Long appointmentId) {
        if (appointmentId == null) {
            throw new ConflictException("Appointment ID is required");
        }

        return repository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Telemedicine session not found for appointment " + appointmentId));
    }

    private TelemedicineSession findSessionById(Long sessionId) {
        if (sessionId == null) {
            throw new ConflictException("Session ID is required");
        }

        return repository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Telemedicine session not found for id " + sessionId));
    }

    private String buildRoomId(Long appointmentId) {
        return ROOM_PREFIX + appointmentId;
    }

    private String buildMeetingUrl(String roomId) {
        if (!StringUtils.hasText(roomId)) {
            throw new ConflictException("Room ID is required");
        }
        return MEETING_BASE_URL + "/" + roomId;
    }
}