package com.smarthealthcare.patient_service.controller;

import com.smarthealthcare.patient_service.dto.ApiResponse;
import com.smarthealthcare.patient_service.dto.CreateOrUpdateProfileRequest;
import com.smarthealthcare.patient_service.dto.PatientProfileResponse;
import com.smarthealthcare.patient_service.security.AuthenticatedPatient;
import com.smarthealthcare.patient_service.service.PatientProfileService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
            @Valid @RequestBody CreateOrUpdateProfileRequest request) {

        PatientProfileResponse response = patientProfileService.updateProfile(
                principal, principal.getFirstName(), principal.getLastName(), request);
                
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @PostMapping(value = "/me/profile-picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PatientProfileResponse>> uploadProfilePicture(
            @AuthenticationPrincipal AuthenticatedPatient principal,
            @RequestParam("file") MultipartFile file) {

        PatientProfileResponse response = patientProfileService.uploadProfilePicture(principal, file);
        return ResponseEntity.ok(ApiResponse.success("Profile picture uploaded successfully", response));
    }

    @GetMapping("/me/profile-picture")
    public ResponseEntity<Resource> getMyProfilePicture(
            @AuthenticationPrincipal AuthenticatedPatient principal) {

        Resource resource = patientProfileService.getProfilePictureResource(principal);
        String contentType = patientProfileService.getProfilePictureContentType(principal);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"profile-picture\"")
                .body(resource);
    }

    @DeleteMapping("/me/profile-picture")
    public ResponseEntity<ApiResponse<PatientProfileResponse>> deleteMyProfilePicture(
            @AuthenticationPrincipal AuthenticatedPatient principal) {

        PatientProfileResponse response = patientProfileService.deleteProfilePicture(principal);
        return ResponseEntity.ok(ApiResponse.success("Profile picture removed successfully", response));
    }
}
