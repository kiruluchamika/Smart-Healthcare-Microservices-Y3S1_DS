package com.smarthealthcare.doctor_service.dto;

import com.smarthealthcare.doctor_service.enums.OnboardingState;
import com.smarthealthcare.doctor_service.enums.VerificationStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
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
    String boardCertifications;
    String languagesSpoken;
    String clinicLocations;
    String insuranceProviders;
    LocalDate licenseExpiryDate;
    BigDecimal consultationFee;
    String profilePictureUrl;
    VerificationStatus verificationStatus;
    Boolean active;
    Integer profileCompletenessScore;
    OnboardingState onboardingState;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
