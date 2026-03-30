package com.smarthealthcare.patient_service.dto;

import com.smarthealthcare.patient_service.entity.EventType;
import com.smarthealthcare.patient_service.entity.MedicalHistory;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class MedicalHistoryResponse {

    private Long id;
    private EventType eventType;
    private String title;
    private String description;
    private LocalDate eventDate;
    private String doctorName;
    private String facilityName;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MedicalHistoryResponse fromEntity(MedicalHistory history) {
        MedicalHistoryResponse resp = new MedicalHistoryResponse();
        resp.setId(history.getId());
        resp.setEventType(history.getEventType());
        resp.setTitle(history.getTitle());
        resp.setDescription(history.getDescription());
        resp.setEventDate(history.getEventDate());
        resp.setDoctorName(history.getDoctorName());
        resp.setFacilityName(history.getFacilityName());
        resp.setNotes(history.getNotes());
        resp.setCreatedAt(history.getCreatedAt());
        resp.setUpdatedAt(history.getUpdatedAt());
        return resp;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public EventType getEventType() { return eventType; }
    public void setEventType(EventType eventType) { this.eventType = eventType; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getEventDate() { return eventDate; }
    public void setEventDate(LocalDate eventDate) { this.eventDate = eventDate; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getFacilityName() { return facilityName; }
    public void setFacilityName(String facilityName) { this.facilityName = facilityName; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
