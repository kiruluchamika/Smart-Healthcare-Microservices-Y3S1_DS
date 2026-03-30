package com.smarthealthcare.doctor_service.dto;

import com.smarthealthcare.doctor_service.enums.VerificationStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DoctorVerificationStatusUpdateRequest {

    @NotNull(message = "Verification status is required")
    private VerificationStatus verificationStatus;

    @Size(max = 500, message = "Reason must not exceed 500 characters")
    private String reason;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;

    @Size(max = 120, message = "Changed by must not exceed 120 characters")
    private String changedBy;
}
