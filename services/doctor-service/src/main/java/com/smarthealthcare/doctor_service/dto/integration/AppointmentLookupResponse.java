package com.smarthealthcare.doctor_service.dto.integration;

import lombok.Data;

@Data
public class AppointmentLookupResponse {
    private Long id;
    private Long patientId;
    private Long doctorId;
    private String status;
}
