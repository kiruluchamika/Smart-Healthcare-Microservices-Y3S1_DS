package com.smarthealthcare.patient_service.controller;

import com.smarthealthcare.patient_service.dto.ApiResponse;
import com.smarthealthcare.patient_service.dto.MedicalReportResponse;
import com.smarthealthcare.patient_service.dto.PatientProfileResponse;
import com.smarthealthcare.patient_service.entity.MedicalReport;
import com.smarthealthcare.patient_service.entity.ReportType;
import com.smarthealthcare.patient_service.security.AuthenticatedPatient;
import com.smarthealthcare.patient_service.service.MedicalReportService;
import com.smarthealthcare.patient_service.service.PatientProfileService;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/patients/doctor/reports")
public class DoctorMedicalReportController {

    private final MedicalReportService medicalReportService;
    private final PatientProfileService patientProfileService;

    public DoctorMedicalReportController(
            MedicalReportService medicalReportService,
            PatientProfileService patientProfileService) {
        this.medicalReportService = medicalReportService;
        this.patientProfileService = patientProfileService;
    }

    @GetMapping("/patient/{patientAuthUserId}")
    public ResponseEntity<ApiResponse<List<MedicalReportResponse>>> getPatientReportsForDoctor(
            @AuthenticationPrincipal AuthenticatedPatient principal,
            @RequestHeader(name = "X-Doctor-Id") Long doctorId,
            @PathVariable Long patientAuthUserId,
            @RequestParam(name = "type", required = false) ReportType type) {

        List<MedicalReportResponse> reports = medicalReportService.getReportsForDoctor(
                doctorId,
                principal.getRole(),
                patientAuthUserId,
                type);

        return ResponseEntity.ok(ApiResponse.success("Reports retrieved successfully", reports));
    }

    @GetMapping("/patient/{patientAuthUserId}/{id}/download")
    public ResponseEntity<Resource> downloadPatientReportForDoctor(
            @AuthenticationPrincipal AuthenticatedPatient principal,
            @RequestHeader(name = "X-Doctor-Id") Long doctorId,
            @PathVariable Long patientAuthUserId,
            @PathVariable Long id) {

        Resource resource = medicalReportService.downloadReportAsResourceForDoctor(
            doctorId,
                principal.getRole(),
                patientAuthUserId,
                id);
        MedicalReport reportInfo = medicalReportService.getReportRawForDoctor(
            doctorId,
                principal.getRole(),
                patientAuthUserId,
                id);

        String contentType = reportInfo.getContentType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + reportInfo.getOriginalFileName() + "\"")
                .body(resource);
    }

    @GetMapping("/patient/{patientAuthUserId}/profile")
    public ResponseEntity<ApiResponse<PatientProfileResponse>> getPatientProfileForDoctor(
            @AuthenticationPrincipal AuthenticatedPatient principal,
            @RequestHeader(name = "X-Doctor-Id") Long doctorId,
            @PathVariable Long patientAuthUserId) {

        PatientProfileResponse response = patientProfileService.getProfileForDoctor(
                doctorId,
                principal.getRole(),
                patientAuthUserId);

        return ResponseEntity.ok(ApiResponse.success("Patient profile retrieved successfully", response));
    }
}