package com.smarthealthcare.doctor_service.controller;

import com.smarthealthcare.doctor_service.dto.PrescriptionCreateRequest;
import com.smarthealthcare.doctor_service.dto.PrescriptionResponse;
import com.smarthealthcare.doctor_service.entity.Prescription;
import com.smarthealthcare.doctor_service.entity.PrescriptionItem;
import com.smarthealthcare.doctor_service.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {
    private final PrescriptionService prescriptionService;

    @PostMapping
    public ResponseEntity<PrescriptionResponse> createDraft(
            @RequestBody PrescriptionCreateRequest request, 
            Authentication authentication,
            @RequestHeader(value = "X-Doctor-Id", required = false) String doctorHeader,
            @RequestHeader(value = "X-Patient-Id", required = false) String patientHeader) {
        Long doctorId = getUserId(authentication, doctorHeader, patientHeader);
        prescriptionService.validateDoctorAppointmentAccess(request.getAppointmentId(), request.getPatientId(), doctorId);
        Prescription prescription = new Prescription();
        prescription.setPatientId(request.getPatientId());
        prescription.setDoctorId(doctorId);
        prescription.setAppointmentId(request.getAppointmentId());
        prescription.setDiagnosis(request.getDiagnosis());
        prescription.setNotes(request.getNotes());
        List<PrescriptionCreateRequest.PrescriptionItemRequest> requestedItems =
                request.getItems() == null ? Collections.emptyList() : request.getItems();
        prescription.setItems(requestedItems.stream().map(itemReq -> {
            PrescriptionItem item = new PrescriptionItem();
            item.setMedicineName(itemReq.getMedicineName());
            item.setMedicineCode(itemReq.getMedicineCode());
            item.setStrength(itemReq.getStrength());
            item.setForm(itemReq.getForm());
            item.setDoseAmount(itemReq.getDoseAmount());
            item.setDoseUnit(itemReq.getDoseUnit());
            item.setFrequencyText(itemReq.getFrequencyText());
            item.setRoute(itemReq.getRoute());
            item.setDurationDays(itemReq.getDurationDays());
            item.setQuantity(itemReq.getQuantity());
            item.setSubstitutionAllowed(itemReq.getSubstitutionAllowed());
            return item;
        }).collect(Collectors.toList()));
        Prescription saved = prescriptionService.createDraft(prescription);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    @PostMapping("/{id}/sign")
    public ResponseEntity<PrescriptionResponse> signPrescription(
            @PathVariable Long id, 
            Authentication authentication,
            @RequestHeader(value = "X-Doctor-Id", required = false) String doctorHeader,
            @RequestHeader(value = "X-Patient-Id", required = false) String patientHeader) {
        Long doctorId = getUserId(authentication, doctorHeader, patientHeader);
        Prescription signed = prescriptionService.signPrescription(id, doctorId);
        return ResponseEntity.ok(toResponse(signed));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrescriptionResponse> getPrescription(
            @PathVariable Long id, 
            Authentication authentication,
            @RequestHeader(value = "X-Doctor-Id", required = false) String doctorHeader,
            @RequestHeader(value = "X-Patient-Id", required = false) String patientHeader) {
        Long userId = getUserId(authentication, doctorHeader, patientHeader);
        String role = getRole(authentication, doctorHeader, patientHeader);
        Prescription prescription = prescriptionService.getPrescription(id, userId, role);
        return ResponseEntity.ok(toResponse(prescription));
    }

    @GetMapping("/by-appointment/{appointmentId}")
    public ResponseEntity<PrescriptionResponse> getPrescriptionByAppointment(
            @PathVariable Long appointmentId,
            Authentication authentication,
            @RequestHeader(value = "X-Doctor-Id", required = false) String doctorHeader,
            @RequestHeader(value = "X-Patient-Id", required = false) String patientHeader) {
        Long userId = getUserId(authentication, doctorHeader, patientHeader);
        String role = getRole(authentication, doctorHeader, patientHeader);
        Prescription prescription = prescriptionService.getPrescriptionByAppointment(appointmentId, userId, role);
        return ResponseEntity.ok(toResponse(prescription));
    }

    @GetMapping("/by-patient/{patientId}")
    public ResponseEntity<List<PrescriptionResponse>> getPrescriptionsByPatient(
            @PathVariable Long patientId, 
            Authentication authentication,
            @RequestHeader(value = "X-Doctor-Id", required = false) String doctorHeader,
            @RequestHeader(value = "X-Patient-Id", required = false) String patientHeader) {
        Long userId = getUserId(authentication, doctorHeader, patientHeader);
        String role = getRole(authentication, doctorHeader, patientHeader);
        List<Prescription> prescriptions = prescriptionService.getPrescriptionsByPatient(patientId, userId, role);
        return ResponseEntity.ok(prescriptions.stream().map(this::toResponse).collect(Collectors.toList()));
    }

    private PrescriptionResponse toResponse(Prescription prescription) {
        PrescriptionResponse resp = new PrescriptionResponse();
        resp.setId(prescription.getId());
        resp.setRxNumber(prescription.getRxNumber());
        resp.setPatientId(prescription.getPatientId());
        resp.setDoctorId(prescription.getDoctorId());
        resp.setAppointmentId(prescription.getAppointmentId());
        resp.setStatus(prescription.getStatus().name());
        resp.setDiagnosis(prescription.getDiagnosis());
        resp.setNotes(prescription.getNotes());
        resp.setIssuedAt(prescription.getIssuedAt());
        resp.setExpiresAt(prescription.getExpiresAt());
        resp.setSignedBy(prescription.getSignedBy());
        resp.setSignedAt(prescription.getSignedAt());
        resp.setVersion(prescription.getVersion());
        if (prescription.getItems() != null) {
            resp.setItems(prescription.getItems().stream().map(item -> {
                PrescriptionResponse.PrescriptionItemResponse ir = new PrescriptionResponse.PrescriptionItemResponse();
                ir.setMedicineName(item.getMedicineName());
                ir.setMedicineCode(item.getMedicineCode());
                ir.setStrength(item.getStrength());
                ir.setForm(item.getForm());
                ir.setDoseAmount(item.getDoseAmount());
                ir.setDoseUnit(item.getDoseUnit());
                ir.setFrequencyText(item.getFrequencyText());
                ir.setRoute(item.getRoute());
                ir.setDurationDays(item.getDurationDays());
                ir.setQuantity(item.getQuantity());
                ir.setSubstitutionAllowed(item.getSubstitutionAllowed());
                return ir;
            }).collect(Collectors.toList()));
        }
        return resp;
    }

    private Long getUserId(Authentication authentication, String doctorHeader, String patientHeader) {
        if (doctorHeader != null && !doctorHeader.isEmpty()) {
            return Long.valueOf(doctorHeader);
        }
        if (patientHeader != null && !patientHeader.isEmpty()) {
            return Long.valueOf(patientHeader);
        }
        try {
            return Long.valueOf(authentication.getName());
        } catch (NumberFormatException e) {
            // Fallback for basic auth system users
            return -1L;
        }
    }

    private String getRole(Authentication authentication, String doctorHeader, String patientHeader) {
        if (doctorHeader != null && !doctorHeader.isEmpty()) {
            return "DOCTOR";
        }
        if (patientHeader != null && !patientHeader.isEmpty()) {
            return "PATIENT";
        }
        return authentication.getAuthorities().stream().findFirst().map(a -> a.getAuthority().replace("ROLE_", "")).orElse("");
    }
}
