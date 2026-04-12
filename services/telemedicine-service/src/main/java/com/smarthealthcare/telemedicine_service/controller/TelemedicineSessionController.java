package com.smarthealthcare.telemedicine_service.controller;

import com.smarthealthcare.telemedicine_service.dto.request.CompleteTelemedicineSessionRequest;
import com.smarthealthcare.telemedicine_service.dto.request.CreateTelemedicineSessionRequest;
import com.smarthealthcare.telemedicine_service.dto.response.TelemedicineSessionResponse;
import com.smarthealthcare.telemedicine_service.service.TelemedicineSessionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping({"/api/telemedicine", "/api/v1/telemedicine"})
public class TelemedicineSessionController {

    private final TelemedicineSessionService telemedicineSessionService;

    public TelemedicineSessionController(TelemedicineSessionService telemedicineSessionService) {
        this.telemedicineSessionService = telemedicineSessionService;
    }

    @PostMapping({"/session", "/sessions"})
    public ResponseEntity<TelemedicineSessionResponse> createSession(
            @Valid @RequestBody CreateTelemedicineSessionRequest request) {
        TelemedicineSessionResponse response = telemedicineSessionService.createSession(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping({"/session/{appointmentId}", "/sessions/{appointmentId}"})
    public ResponseEntity<TelemedicineSessionResponse> getSessionByAppointmentId(
            @PathVariable @Positive Long appointmentId) {
        return ResponseEntity.ok(telemedicineSessionService.getSessionByAppointmentId(appointmentId));
    }

    @GetMapping("/sessions/patient/{patientId}")
    public ResponseEntity<List<TelemedicineSessionResponse>> getSessionsByPatientId(
            @PathVariable @Positive Long patientId) {
        return ResponseEntity.ok(telemedicineSessionService.getSessionsByPatientId(patientId));
    }

    @GetMapping("/sessions/doctor/{doctorId}")
    public ResponseEntity<List<TelemedicineSessionResponse>> getSessionsByDoctorId(
            @PathVariable @Positive Long doctorId) {
        return ResponseEntity.ok(telemedicineSessionService.getSessionsByDoctorId(doctorId));
    }

    @GetMapping("/sessions/admin/summary")
    public ResponseEntity<List<TelemedicineSessionResponse>> getAllSessions() {
        return ResponseEntity.ok(telemedicineSessionService.getAllSessions());
    }

    @PutMapping({"/session/{sessionId}/start", "/sessions/{sessionId}/start"})
    public ResponseEntity<TelemedicineSessionResponse> startSession(
            @PathVariable @Positive Long sessionId) {
        return ResponseEntity.ok(telemedicineSessionService.startSession(sessionId));
    }

    @PutMapping({"/session/{sessionId}/complete", "/sessions/{sessionId}/complete"})
    public ResponseEntity<TelemedicineSessionResponse> completeSession(
            @PathVariable @Positive Long sessionId,
            @Valid @RequestBody(required = false) CompleteTelemedicineSessionRequest request) {
        CompleteTelemedicineSessionRequest payload = request == null
                ? new CompleteTelemedicineSessionRequest(null)
                : request;
        return ResponseEntity.ok(telemedicineSessionService.completeSession(sessionId, payload));
    }
}
