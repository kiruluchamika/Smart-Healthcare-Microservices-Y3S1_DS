package com.smarthealthcare.patient_service.service;

import com.smarthealthcare.patient_service.dto.CreateOrUpdateProfileRequest;
import com.smarthealthcare.patient_service.dto.PatientProfileResponse;
import com.smarthealthcare.patient_service.entity.PatientProfile;
import com.smarthealthcare.patient_service.repository.PatientProfileRepository;
import com.smarthealthcare.patient_service.security.AuthenticatedPatient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientProfileService {

    private final PatientProfileRepository patientProfileRepository;

    public PatientProfileService(PatientProfileRepository patientProfileRepository) {
        this.patientProfileRepository = patientProfileRepository;
    }

    /**
     * Finds the profile by authUserId. If it doesn't exist, auto-creates it.
     */
    @Transactional
    public PatientProfileResponse getOrCreateProfile(AuthenticatedPatient principal, String firstName, String lastName) {
        PatientProfile profile = patientProfileRepository.findByAuthUserId(principal.getAuthUserId())
                .orElseGet(() -> {
                    PatientProfile newProfile = new PatientProfile();
                    newProfile.setAuthUserId(principal.getAuthUserId());
                    return patientProfileRepository.save(newProfile);
                });

        return PatientProfileResponse.fromEntity(profile, firstName, lastName, principal.getEmail());
    }

    /**
     * Updates an existing profile via a request object.
     */
    @Transactional
    public PatientProfileResponse updateProfile(AuthenticatedPatient principal,
                                                String firstName, String lastName,
                                                CreateOrUpdateProfileRequest request) {
        PatientProfile profile = patientProfileRepository.findByAuthUserId(principal.getAuthUserId())
                .orElseGet(() -> {
                    PatientProfile newProfile = new PatientProfile();
                    newProfile.setAuthUserId(principal.getAuthUserId());
                    return newProfile;
                });

        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setGender(request.getGender());
        profile.setBloodGroup(request.getBloodGroup());
        profile.setAddress(request.getAddress());
        profile.setEmergencyContactName(request.getEmergencyContactName());
        profile.setEmergencyContactPhone(request.getEmergencyContactPhone());
        profile.setAllergies(request.getAllergies());
        profile.setChronicConditions(request.getChronicConditions());
        profile.setBio(request.getBio());

        PatientProfile savedProfile = patientProfileRepository.save(profile);
        return PatientProfileResponse.fromEntity(savedProfile, firstName, lastName, principal.getEmail());
    }
}
