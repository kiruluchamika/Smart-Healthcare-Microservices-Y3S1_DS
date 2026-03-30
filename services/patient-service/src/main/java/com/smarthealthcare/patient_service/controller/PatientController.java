package com.smarthealthcare.patient_service.controller;

import com.smarthealthcare.patient_service.dto.ApiResponse;
import com.smarthealthcare.patient_service.dto.CreateOrUpdateProfileRequest;
import com.smarthealthcare.patient_service.dto.PatientProfileResponse;
import com.smarthealthcare.patient_service.security.AuthenticatedPatient;
import com.smarthealthcare.patient_service.service.PatientProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/patients")
public class PatientController {

    private final PatientProfileService patientProfileService;

    public PatientController(PatientProfileService patientProfileService) {
        this.patientProfileService = patientProfileService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "patient-service"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PatientProfileResponse>> getMyProfile(
            @AuthenticationPrincipal AuthenticatedPatient principal) {
        
        PatientProfileResponse response = patientProfileService.getOrCreateProfile(
                principal, principal.getFirstName(), principal.getLastName());
                
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", response));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<PatientProfileResponse>> updateMyProfile(
            @AuthenticationPrincipal AuthenticatedPatient principal,
            @RequestBody CreateOrUpdateProfileRequest request) {

        PatientProfileResponse response = patientProfileService.updateProfile(
                principal, principal.getFirstName(), principal.getLastName(), request);
                
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }
}
