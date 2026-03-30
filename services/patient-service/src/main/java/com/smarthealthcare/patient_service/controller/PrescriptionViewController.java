package com.smarthealthcare.patient_service.controller;

import com.smarthealthcare.patient_service.dto.ApiResponse;
import com.smarthealthcare.patient_service.security.AuthenticatedPatient;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/patients/me/prescriptions")
public class PrescriptionViewController {

    @GetMapping
    public ResponseEntity<ApiResponse<List<Object>>> getPrescriptions(
            @AuthenticationPrincipal AuthenticatedPatient principal) {

        // STUB - Phase 1: Returns empty list until prescription-service / doctor-service is ready
        List<Object> emptyPrescriptions = new ArrayList<>();
        return ResponseEntity.ok(ApiResponse.success("Prescriptions retrieved successfully", emptyPrescriptions));
    }
}
