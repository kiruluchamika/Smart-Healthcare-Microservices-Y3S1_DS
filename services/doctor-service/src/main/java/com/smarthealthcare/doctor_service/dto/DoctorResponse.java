package com.smarthealthcare.doctor_service.dto;

import com.smarthealthcare.doctor_service.enums.OnboardingState;
import com.smarthealthcare.doctor_service.enums.VerificationStatus;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class DoctorResponse {
    Long id;
    String firstName;
    String lastName;
    String email;
    String phone;
    String specialization;
    String qualifications;
    Integer experienceYears;
    String licenseNumber;
    String bio;
    VerificationStatus verificationStatus;
    Boolean active;
    Integer profileCompletenessScore;
    OnboardingState onboardingState;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
