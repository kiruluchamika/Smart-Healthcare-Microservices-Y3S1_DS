package com.smarthealthcare.doctor_service.controller;

import com.smarthealthcare.doctor_service.dto.ApiSuccessResponse;
import com.smarthealthcare.doctor_service.dto.DoctorAvailabilityCreateRequest;
import com.smarthealthcare.doctor_service.dto.DoctorAvailabilityResponse;
import com.smarthealthcare.doctor_service.dto.DoctorAvailabilityUpdateRequest;
import com.smarthealthcare.doctor_service.dto.DoctorCreateRequest;
import com.smarthealthcare.doctor_service.dto.DoctorDashboardSummaryResponse;
import com.smarthealthcare.doctor_service.dto.DoctorResponse;
import com.smarthealthcare.doctor_service.dto.DoctorUpdateRequest;
import com.smarthealthcare.doctor_service.dto.DoctorVerificationHistoryResponse;
import com.smarthealthcare.doctor_service.dto.DoctorVerificationStatusUpdateRequest;
import com.smarthealthcare.doctor_service.dto.PagedResponse;
import com.smarthealthcare.doctor_service.service.DoctorAvailabilityService;
import com.smarthealthcare.doctor_service.service.DoctorService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.time.DayOfWeek;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;
    private final DoctorAvailabilityService availabilityService;

    @PostMapping
    @Operation(summary = "Create doctor profile")
    public ResponseEntity<DoctorResponse> createDoctor(
            @Valid @RequestBody DoctorCreateRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        return ResponseEntity.status(HttpStatus.CREATED).body(doctorService.createDoctor(request, idempotencyKey));
    }

    @GetMapping("/{doctorId}")
    @Operation(summary = "Get doctor by id")
    public ResponseEntity<DoctorResponse> getDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(doctorService.getDoctorById(doctorId));
    }

    @GetMapping("/by-email")
    @Operation(summary = "Get doctor by email")
    public ResponseEntity<DoctorResponse> getDoctorByEmail(@RequestParam String email) {
        return ResponseEntity.ok(doctorService.getDoctorByEmail(email));
    }

    @PutMapping("/{doctorId}")
    @Operation(summary = "Update doctor by id")
    public ResponseEntity<DoctorResponse> updateDoctor(
            @PathVariable Long doctorId,
            @Valid @RequestBody DoctorUpdateRequest request) {
        return ResponseEntity.ok(doctorService.updateDoctor(doctorId, request));
    }

    @DeleteMapping("/{doctorId}")
    @Operation(summary = "Delete doctor by id")
    public ResponseEntity<ApiSuccessResponse> deleteDoctor(@PathVariable Long doctorId) {
        doctorService.deleteDoctor(doctorId);
        return ResponseEntity.ok(ApiSuccessResponse.builder().message("Doctor deleted successfully").build());
    }

    @GetMapping
    @Operation(summary = "Get all doctors with pagination")
    public ResponseEntity<PagedResponse<DoctorResponse>> getDoctors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(doctorService.getDoctors(page, size, sortBy, sortDir));
    }

    @GetMapping("/search")
    @Operation(summary = "Search doctors by specialization/verification and other filters")
    public ResponseEntity<List<DoctorResponse>> searchDoctors(
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) Boolean verified,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Integer minExperience,
            @RequestParam(required = false) DayOfWeek dayOfWeek) {
        return ResponseEntity
                .ok(doctorService.searchDoctors(specialization, verified, active, minExperience, dayOfWeek));
    }

    @PatchMapping("/{doctorId}/verification-status")
    @Operation(summary = "Update doctor verification status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DoctorResponse> updateVerificationStatus(
            @PathVariable Long doctorId,
            @Valid @RequestBody DoctorVerificationStatusUpdateRequest request) {
        return ResponseEntity.ok(doctorService.updateVerificationStatus(doctorId, request));
    }

    @GetMapping("/{doctorId}/verification-history")
    @Operation(summary = "Get verification timeline for doctor")
    public ResponseEntity<List<DoctorVerificationHistoryResponse>> getVerificationHistory(@PathVariable Long doctorId) {
        return ResponseEntity.ok(doctorService.getVerificationHistory(doctorId));
    }

    @PostMapping("/{doctorId}/availability")
    @Operation(summary = "Create doctor availability slot")
    public ResponseEntity<DoctorAvailabilityResponse> createAvailability(
            @PathVariable Long doctorId,
            @Valid @RequestBody DoctorAvailabilityCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(availabilityService.createAvailability(doctorId, request));
    }

    @GetMapping("/{doctorId}/availability")
    @Operation(summary = "Get doctor availability slots")
    public ResponseEntity<List<DoctorAvailabilityResponse>> getAvailabilities(@PathVariable Long doctorId) {
        return ResponseEntity.ok(availabilityService.getAvailabilities(doctorId));
    }

    @PutMapping("/{doctorId}/availability/{availabilityId}")
    @Operation(summary = "Update doctor availability slot")
    public ResponseEntity<DoctorAvailabilityResponse> updateAvailability(
            @PathVariable Long doctorId,
            @PathVariable Long availabilityId,
            @Valid @RequestBody DoctorAvailabilityUpdateRequest request) {
        return ResponseEntity.ok(availabilityService.updateAvailability(doctorId, availabilityId, request));
    }

    @DeleteMapping("/{doctorId}/availability/{availabilityId}")
    @Operation(summary = "Delete doctor availability slot")
    public ResponseEntity<ApiSuccessResponse> deleteAvailability(
            @PathVariable Long doctorId,
            @PathVariable Long availabilityId) {
        availabilityService.deleteAvailability(doctorId, availabilityId);
        return ResponseEntity.ok(ApiSuccessResponse.builder().message("Availability deleted successfully").build());
    }

    @GetMapping("/{doctorId}/dashboard-summary")
    @Operation(summary = "Get doctor dashboard summary")
    public ResponseEntity<DoctorDashboardSummaryResponse> getDashboardSummary(@PathVariable Long doctorId) {
        return ResponseEntity.ok(doctorService.getDashboardSummary(doctorId));
    }
}
