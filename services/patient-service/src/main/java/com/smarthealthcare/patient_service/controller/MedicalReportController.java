package com.smarthealthcare.patient_service.controller;

import com.smarthealthcare.patient_service.dto.ApiResponse;
import com.smarthealthcare.patient_service.dto.MedicalReportResponse;
import com.smarthealthcare.patient_service.entity.MedicalReport;
import com.smarthealthcare.patient_service.entity.ReportType;
import com.smarthealthcare.patient_service.security.AuthenticatedPatient;
import com.smarthealthcare.patient_service.service.MedicalReportService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/patients/me/reports")
public class MedicalReportController {

    private final MedicalReportService medicalReportService;

    public MedicalReportController(MedicalReportService medicalReportService) {
        this.medicalReportService = medicalReportService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MedicalReportResponse>>> getMyReports(
            @AuthenticationPrincipal AuthenticatedPatient principal,
            @RequestParam(name = "type", required = false) ReportType type) {

        List<MedicalReportResponse> reports = medicalReportService.getReports(principal.getAuthUserId(), type);
        return ResponseEntity.ok(ApiResponse.success("Reports retrieved successfully", reports));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<MedicalReportResponse>> uploadReport(
            @AuthenticationPrincipal AuthenticatedPatient principal,
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("reportType") ReportType reportType,
            @RequestParam(value = "reportDate", required = false) String reportDateStr) {

        LocalDate reportDate = (reportDateStr != null && !reportDateStr.isEmpty()) 
                ? LocalDate.parse(reportDateStr) 
                : LocalDate.now();

        MedicalReportResponse response = medicalReportService.uploadReport(
                principal.getAuthUserId(), file, title, description, reportType, reportDate);

        return ResponseEntity.ok(ApiResponse.success("Report uploaded successfully", response));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadReport(
            @AuthenticationPrincipal AuthenticatedPatient principal,
            @PathVariable("id") Long id) {

        Resource resource = medicalReportService.downloadReportAsResource(principal.getAuthUserId(), id);
        MedicalReport reportInfo = medicalReportService.getReportRaw(principal.getAuthUserId(), id);

        String contentType = reportInfo.getContentType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + reportInfo.getOriginalFileName() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReport(
            @AuthenticationPrincipal AuthenticatedPatient principal,
            @PathVariable("id") Long id) {

        medicalReportService.deleteReport(principal.getAuthUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Report deleted successfully", null));
    }
}
