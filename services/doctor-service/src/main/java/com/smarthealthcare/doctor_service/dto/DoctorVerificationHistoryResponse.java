package com.smarthealthcare.doctor_service.dto;

import com.smarthealthcare.doctor_service.enums.VerificationStatus;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class DoctorVerificationHistoryResponse {
    Long id;
    Long doctorId;
    VerificationStatus previousStatus;
    VerificationStatus newStatus;
    String reason;
    String notes;
    String changedBy;
    LocalDateTime changedAt;
}
