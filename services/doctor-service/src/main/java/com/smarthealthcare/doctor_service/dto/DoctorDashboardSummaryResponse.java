package com.smarthealthcare.doctor_service.dto;

import com.smarthealthcare.doctor_service.enums.VerificationStatus;
import java.util.Map;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class DoctorDashboardSummaryResponse {
    Long doctorId;
    String doctorName;
    String specialization;
    VerificationStatus verificationStatus;
    Boolean active;
    Integer profileCompletenessScore;
    Long totalSlots;
    Long availableSlots;
    Map<String, Long> weeklySlotCount;
    String profileInsight;
}
