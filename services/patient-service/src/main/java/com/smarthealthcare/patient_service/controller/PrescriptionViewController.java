package com.smarthealthcare.patient_service.controller;

import com.smarthealthcare.patient_service.dto.ApiResponse;
import com.smarthealthcare.patient_service.security.AuthenticatedPatient;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import com.smarthealthcare.patient_service.client.DoctorServiceClient;

@RestController
@RequestMapping("/patients/me/prescriptions")
public class PrescriptionViewController {
    private final DoctorServiceClient doctorServiceClient;

    public PrescriptionViewController(DoctorServiceClient doctorServiceClient) {
        this.doctorServiceClient = doctorServiceClient;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Object>>> getPrescriptions(
            @AuthenticationPrincipal AuthenticatedPatient principal) {
        Long patientId = principal.getAuthUserId();
        // In a real system, pass JWT for auth; here, omitted for brevity
        List<Object> prescriptions = (List<Object>) (List<?>) doctorServiceClient.getPrescriptionsForPatient(patientId, null);
        return ResponseEntity.ok(ApiResponse.success("Prescriptions retrieved successfully", prescriptions));
    }
}
