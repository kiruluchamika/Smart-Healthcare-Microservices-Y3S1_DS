package com.smarthealthcare.doctor_service.mapper;

import com.smarthealthcare.doctor_service.dto.DoctorCreateRequest;
import com.smarthealthcare.doctor_service.dto.DoctorResponse;
import com.smarthealthcare.doctor_service.dto.DoctorUpdateRequest;
import com.smarthealthcare.doctor_service.entity.Doctor;
import com.smarthealthcare.doctor_service.enums.OnboardingState;
import com.smarthealthcare.doctor_service.enums.VerificationStatus;
import org.springframework.stereotype.Component;

@Component
public class DoctorMapper {

    public Doctor toEntity(DoctorCreateRequest request) {
        return Doctor.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .specialization(request.getSpecialization())
                .qualifications(request.getQualifications())
                .experienceYears(request.getExperienceYears())
                .licenseNumber(request.getLicenseNumber())
                .bio(request.getBio())
                .boardCertifications(request.getBoardCertifications())
                .languagesSpoken(request.getLanguagesSpoken())
                .clinicLocations(request.getClinicLocations())
                .insuranceProviders(request.getInsuranceProviders())
                .licenseExpiryDate(request.getLicenseExpiryDate())
                .verificationStatus(VerificationStatus.PENDING)
                .onboardingState(OnboardingState.SUBMITTED)
                .build();
    }

    public void updateEntity(Doctor doctor, DoctorUpdateRequest request) {
        doctor.setFirstName(request.getFirstName());
        doctor.setLastName(request.getLastName());
        doctor.setEmail(request.getEmail());
        doctor.setPhone(request.getPhone());
        doctor.setSpecialization(request.getSpecialization());
        doctor.setQualifications(request.getQualifications());
        doctor.setExperienceYears(request.getExperienceYears());
        doctor.setLicenseNumber(request.getLicenseNumber());
        doctor.setBio(request.getBio());
        doctor.setBoardCertifications(request.getBoardCertifications());
        doctor.setLanguagesSpoken(request.getLanguagesSpoken());
        doctor.setClinicLocations(request.getClinicLocations());
        doctor.setInsuranceProviders(request.getInsuranceProviders());
        doctor.setLicenseExpiryDate(request.getLicenseExpiryDate());
    }

    public DoctorResponse toResponse(Doctor doctor) {
        return DoctorResponse.builder()
                .id(doctor.getId())
                .firstName(doctor.getFirstName())
                .lastName(doctor.getLastName())
                .email(doctor.getEmail())
                .phone(doctor.getPhone())
                .specialization(doctor.getSpecialization())
                .qualifications(doctor.getQualifications())
                .experienceYears(doctor.getExperienceYears())
                .licenseNumber(doctor.getLicenseNumber())
                .bio(doctor.getBio())
                .boardCertifications(doctor.getBoardCertifications())
                .languagesSpoken(doctor.getLanguagesSpoken())
                .clinicLocations(doctor.getClinicLocations())
                .insuranceProviders(doctor.getInsuranceProviders())
                .licenseExpiryDate(doctor.getLicenseExpiryDate())
                .verificationStatus(doctor.getVerificationStatus())
                .active(doctor.getActive())
                .profileCompletenessScore(doctor.getProfileCompletenessScore())
                .onboardingState(doctor.getOnboardingState())
                .createdAt(doctor.getCreatedAt())
                .updatedAt(doctor.getUpdatedAt())
                .build();
    }
}
