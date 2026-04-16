package com.smarthealthcare.doctor_service.dto;

import lombok.Data;
import java.util.List;

@Data
public class PrescriptionCreateRequest {
    private Long patientId;
    private Long appointmentId;
    private String diagnosis;
    private String notes;
    private List<PrescriptionItemRequest> items;

    @Data
    public static class PrescriptionItemRequest {
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
