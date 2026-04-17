package com.smarthealthcare.doctor_service.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PrescriptionResponse {
    private Long id;
    private String rxNumber;
    private Long patientId;
    private Long doctorId;
    private Long appointmentId;
    private String status;
    private String diagnosis;
    private String notes;
    private LocalDateTime issuedAt;
    private LocalDateTime expiresAt;
    private String signedBy;
    private LocalDateTime signedAt;
    private Integer version;
    private List<PrescriptionItemResponse> items;

    @Data
    public static class PrescriptionItemResponse {
        private String medicineName;
        private String medicineCode;
        private String strength;
        private String form;
        private String doseAmount;
        private String doseUnit;
        private String frequencyText;
        private String route;
        private Integer durationDays;
        private Integer quantity;
        private Boolean substitutionAllowed;
    }
}
