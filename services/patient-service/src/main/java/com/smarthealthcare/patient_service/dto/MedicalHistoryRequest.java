package com.smarthealthcare.patient_service.dto;

import com.smarthealthcare.patient_service.entity.EventType;
import java.time.LocalDate;

public class MedicalHistoryRequest {

    private EventType eventType;
    private String title;
    private String description;
    private LocalDate eventDate;
    private String doctorName;
    private String facilityName;
    private String notes;

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
}
