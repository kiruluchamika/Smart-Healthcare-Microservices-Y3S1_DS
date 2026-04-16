package com.smarthealthcare.appointment_service.controller;

import com.smarthealthcare.appointment_service.dto.request.CreateAppointmentRequest;
import com.smarthealthcare.appointment_service.dto.request.RescheduleAppointmentRequest;
import com.smarthealthcare.appointment_service.dto.request.AcceptAppointmentRequest;
import com.smarthealthcare.appointment_service.dto.request.UpdateAppointmentPaymentStatusRequest;
import com.smarthealthcare.appointment_service.dto.response.ApiMessageResponse;
import com.smarthealthcare.appointment_service.dto.response.AppointmentAccessResponse;
import com.smarthealthcare.appointment_service.dto.response.AppointmentResponse;
import com.smarthealthcare.appointment_service.dto.response.AvailabilityResponse;
import com.smarthealthcare.appointment_service.dto.response.CalendarAvailabilityResponse;
import com.smarthealthcare.appointment_service.service.AppointmentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    public ResponseEntity<AppointmentResponse> createAppointment(
            @Valid @RequestBody CreateAppointmentRequest request) {
        AppointmentResponse response = appointmentService.createAppointment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{appointmentId}")
    public ResponseEntity<AppointmentResponse> getAppointmentById(@PathVariable @Positive Long appointmentId) {
        return ResponseEntity.ok(appointmentService.getAppointmentById(appointmentId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments(
            @RequestHeader("X-Patient-Id") @Positive Long patientId) {
        return ResponseEntity.ok(appointmentService.getMyAppointments(patientId));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<AppointmentResponse>> getAppointmentsByPatientId(
            @PathVariable @Positive Long patientId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByPatientId(patientId));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<AppointmentResponse>> getAppointmentsByDoctorId(
            @PathVariable @Positive Long doctorId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByDoctorId(doctorId));
    }

    @GetMapping("/doctor/me")
    public ResponseEntity<List<AppointmentResponse>> getMyDoctorAppointments(
            @RequestHeader("X-Doctor-Id") @Positive Long doctorId) {
        return ResponseEntity.ok(appointmentService.getMyDoctorAppointments(doctorId));
    }

    @PatchMapping("/{appointmentId}/reschedule")
    public ResponseEntity<AppointmentResponse> rescheduleAppointment(
            @PathVariable @Positive Long appointmentId,
            @RequestHeader("X-Patient-Id") @Positive Long patientId,
            @Valid @RequestBody RescheduleAppointmentRequest request) {
        return ResponseEntity.ok(appointmentService.rescheduleAppointment(appointmentId, patientId, request));
    }

    @PatchMapping("/{appointmentId}/cancel")
    public ResponseEntity<ApiMessageResponse> cancelAppointment(
            @PathVariable @Positive Long appointmentId,
            @RequestHeader("X-Patient-Id") @Positive Long patientId) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(appointmentId, patientId));
    }

    @PatchMapping("/{appointmentId}/accept")
    public ResponseEntity<AppointmentResponse> acceptAppointment(
            @PathVariable @Positive Long appointmentId,
            @RequestHeader("X-Doctor-Id") @Positive Long doctorId,
            @Valid @RequestBody(required = false) AcceptAppointmentRequest request) {
        return ResponseEntity.ok(appointmentService.acceptAppointment(appointmentId, doctorId, request));
    }

    @PatchMapping("/{appointmentId}/reject")
    public ResponseEntity<AppointmentResponse> rejectAppointment(
            @PathVariable @Positive Long appointmentId,
            @RequestHeader("X-Doctor-Id") @Positive Long doctorId) {
        return ResponseEntity.ok(appointmentService.rejectAppointment(appointmentId, doctorId));
    }

    @PatchMapping("/{appointmentId}/complete")
    public ResponseEntity<AppointmentResponse> completeAppointment(
            @PathVariable @Positive Long appointmentId,
            @RequestHeader("X-Doctor-Id") @Positive Long doctorId) {
        return ResponseEntity.ok(appointmentService.completeAppointment(appointmentId, doctorId));
    }

    @PatchMapping("/{appointmentId}/payment-status")
    public ResponseEntity<AppointmentResponse> updatePaymentStatus(
            @PathVariable @Positive Long appointmentId,
            @Valid @RequestBody UpdateAppointmentPaymentStatusRequest request) {
        return ResponseEntity.ok(appointmentService.updatePaymentStatus(appointmentId, request));
    }

    @GetMapping("/availability")
    public ResponseEntity<AvailabilityResponse> getDoctorAvailability(
            @RequestParam @Positive Long doctorId,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate appointmentDate) {
        return ResponseEntity.ok(appointmentService.getDoctorAvailability(doctorId, appointmentDate));
    }

    @GetMapping("/availability/calendar")
    public ResponseEntity<CalendarAvailabilityResponse> getDoctorAvailabilityCalendar(
            @RequestParam @Positive Long doctorId,
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate rangeStart,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate rangeEnd) {
        return ResponseEntity.ok(appointmentService.getDoctorAvailabilityCalendar(doctorId, rangeStart, rangeEnd));
    }

    @GetMapping("/internal/access-check")
    public ResponseEntity<AppointmentAccessResponse> hasDoctorCompletedAppointmentWithPatient(
            @RequestParam(name = "doctorId") @Positive Long doctorId,
            @RequestParam(name = "patientId") @Positive Long patientId) {
        boolean hasAccess = appointmentService.hasDoctorCompletedAppointmentWithPatient(doctorId, patientId);
        return ResponseEntity.ok(new AppointmentAccessResponse(hasAccess));
    }
}
