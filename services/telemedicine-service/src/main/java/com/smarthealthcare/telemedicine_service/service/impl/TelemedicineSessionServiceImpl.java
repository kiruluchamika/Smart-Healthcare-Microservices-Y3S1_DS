package com.smarthealthcare.telemedicine_service.service.impl;

import com.smarthealthcare.telemedicine_service.dto.request.CompleteTelemedicineSessionRequest;
import com.smarthealthcare.telemedicine_service.dto.request.CreateTelemedicineSessionRequest;
import com.smarthealthcare.telemedicine_service.dto.response.TelemedicineSessionResponse;
import com.smarthealthcare.telemedicine_service.entity.TelemedicineSession;
import com.smarthealthcare.telemedicine_service.entity.TelemedicineSessionStatus;
import com.smarthealthcare.telemedicine_service.exception.ConflictException;
import com.smarthealthcare.telemedicine_service.exception.ResourceNotFoundException;
import com.smarthealthcare.telemedicine_service.repository.TelemedicineSessionRepository;
import com.smarthealthcare.telemedicine_service.service.TelemedicineSessionService;
import java.time.LocalDateTime;
import java.util.List;
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
            mergeSessionMetadata(existingSession, request);
            return TelemedicineSessionResponse.fromEntity(repository.save(existingSession));
        }

        TelemedicineSession session = new TelemedicineSession();
        session.setAppointmentId(appointmentId);
        session.setRoomId(buildRoomId(appointmentId));
        session.setMeetingUrl(buildMeetingUrl(session.getRoomId()));
        session.setStatus(TelemedicineSessionStatus.CREATED);
        mergeSessionMetadata(session, request);

        return TelemedicineSessionResponse.fromEntity(repository.save(session));
    }

    @Override
    @Transactional(readOnly = true)
    public TelemedicineSessionResponse getSessionByAppointmentId(Long appointmentId) {
        return TelemedicineSessionResponse.fromEntity(findSessionByAppointmentId(appointmentId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TelemedicineSessionResponse> getSessionsByPatientId(Long patientId) {
        if (patientId == null) {
            throw new ConflictException("Patient ID is required");
        }

        return repository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream()
                .map(TelemedicineSessionResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TelemedicineSessionResponse> getSessionsByDoctorId(Long doctorId) {
        if (doctorId == null) {
            throw new ConflictException("Doctor ID is required");
        }

        return repository.findByDoctorIdOrderByCreatedAtDesc(doctorId)
                .stream()
                .map(TelemedicineSessionResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TelemedicineSessionResponse> getAllSessions() {
        return repository.findAll()
                .stream()
                .sorted((left, right) -> right.getCreatedAt().compareTo(left.getCreatedAt()))
                .map(TelemedicineSessionResponse::fromEntity)
                .toList();
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
        if (session.getStartedAt() == null) {
            session.setStartedAt(LocalDateTime.now());
        }
        return TelemedicineSessionResponse.fromEntity(repository.save(session));
    }

    @Override
    @Transactional
    public TelemedicineSessionResponse completeSession(Long sessionId, CompleteTelemedicineSessionRequest request) {
        TelemedicineSession session = findSessionById(sessionId);
        if (session.getStatus() == TelemedicineSessionStatus.COMPLETED) {
            return TelemedicineSessionResponse.fromEntity(session);
        }
        if (session.getStatus() != TelemedicineSessionStatus.STARTED) {
            throw new ConflictException("Session must be started before it can be completed");
        }

        session.setStatus(TelemedicineSessionStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());
        if (request != null && StringUtils.hasText(request.consultationSummary())) {
            session.setConsultationSummary(request.consultationSummary().trim());
        }
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

    private void mergeSessionMetadata(TelemedicineSession session, CreateTelemedicineSessionRequest request) {
        if (request.paymentId() != null) {
            session.setPaymentId(request.paymentId());
        }
        if (request.patientId() != null) {
            session.setPatientId(request.patientId());
        }
        if (request.doctorId() != null) {
            session.setDoctorId(request.doctorId());
        }
        if (request.appointmentDate() != null) {
            session.setAppointmentDate(request.appointmentDate());
        }
        if (request.startTime() != null) {
            session.setStartTime(request.startTime());
        }
        if (request.endTime() != null) {
            session.setEndTime(request.endTime());
        }
        if (StringUtils.hasText(request.appointmentType())) {
            session.setAppointmentType(request.appointmentType().trim().toUpperCase());
        }
        if (request.amount() != null) {
            session.setAmount(request.amount());
        }
        if (StringUtils.hasText(request.currency())) {
            session.setCurrency(request.currency().trim().toUpperCase());
        }
        if (StringUtils.hasText(request.reasonForVisit())) {
            session.setReasonForVisit(request.reasonForVisit().trim());
        }
    }
}
