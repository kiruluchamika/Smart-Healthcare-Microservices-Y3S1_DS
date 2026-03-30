package com.smarthealthcare.patient_service.controller;

import com.smarthealthcare.patient_service.dto.ApiResponse;
import com.smarthealthcare.patient_service.dto.MedicalHistoryRequest;
import com.smarthealthcare.patient_service.dto.MedicalHistoryResponse;
import com.smarthealthcare.patient_service.security.AuthenticatedPatient;
import com.smarthealthcare.patient_service.service.MedicalHistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/patients/me/history")
public class MedicalHistoryController {

    private final MedicalHistoryService medicalHistoryService;

    public MedicalHistoryController(MedicalHistoryService medicalHistoryService) {
        this.medicalHistoryService = medicalHistoryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MedicalHistoryResponse>>> getMyHistory(
            @AuthenticationPrincipal AuthenticatedPatient principal) {

        List<MedicalHistoryResponse> history = medicalHistoryService.getHistory(principal.getAuthUserId());
        return ResponseEntity.ok(ApiResponse.success("Medical history retrieved successfully", history));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MedicalHistoryResponse>> addHistoryEntry(
            @AuthenticationPrincipal AuthenticatedPatient principal,
            @RequestBody MedicalHistoryRequest request) {

        MedicalHistoryResponse response = medicalHistoryService.addEntry(principal.getAuthUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("History entry added successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicalHistoryResponse>> updateHistoryEntry(
            @AuthenticationPrincipal AuthenticatedPatient principal,
            @PathVariable Long id,
            @RequestBody MedicalHistoryRequest request) {

        MedicalHistoryResponse response = medicalHistoryService.updateEntry(principal.getAuthUserId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("History entry updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHistoryEntry(
            @AuthenticationPrincipal AuthenticatedPatient principal,
            @PathVariable Long id) {

        medicalHistoryService.deleteEntry(principal.getAuthUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("History entry deleted successfully", null));
    }
}
