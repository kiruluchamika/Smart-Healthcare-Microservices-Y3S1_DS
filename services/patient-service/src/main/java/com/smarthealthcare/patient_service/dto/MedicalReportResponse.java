package com.smarthealthcare.patient_service.dto;

import com.smarthealthcare.patient_service.entity.MedicalReport;
import com.smarthealthcare.patient_service.entity.ReportType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class MedicalReportResponse {

    private Long id;
    private String title;
    private String description;
    private String originalFileName;
    private Long fileSize;
    private String contentType;
    private ReportType reportType;
    private LocalDate reportDate;
    private LocalDateTime uploadedAt;

    public static MedicalReportResponse fromEntity(MedicalReport report) {
        MedicalReportResponse resp = new MedicalReportResponse();
        resp.setId(report.getId());
        resp.setTitle(report.getTitle());
        resp.setDescription(report.getDescription());
        resp.setOriginalFileName(report.getOriginalFileName());
        resp.setFileSize(report.getFileSize());
        resp.setContentType(report.getContentType());
        resp.setReportType(report.getReportType());
        resp.setReportDate(report.getReportDate());
        resp.setUploadedAt(report.getUploadedAt());
        return resp;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public ReportType getReportType() { return reportType; }
    public void setReportType(ReportType reportType) { this.reportType = reportType; }

    public LocalDate getReportDate() { return reportDate; }
    public void setReportDate(LocalDate reportDate) { this.reportDate = reportDate; }

    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
}
