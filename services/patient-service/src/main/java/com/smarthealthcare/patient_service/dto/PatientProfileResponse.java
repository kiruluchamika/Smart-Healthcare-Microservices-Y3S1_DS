package com.smarthealthcare.patient_service.dto;

import com.smarthealthcare.patient_service.entity.Gender;
import com.smarthealthcare.patient_service.entity.PatientProfile;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO for patient profile.
 * Combines patient_profiles DB data with identity fields from JWT context.
 */
public class PatientProfileResponse {

    private Long id;
    private Long authUserId;

    // Identity fields from JWT (not stored in patient DB)
    private String firstName;
    private String lastName;
    private String email;

    // Extended medical fields from patient_profiles table
    private LocalDate dateOfBirth;
    private Gender gender;
    private String bloodGroup;
    private String address;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String allergies;
    private String chronicConditions;
    private String profilePictureUrl;
    private String bio;

    private int totalReports;
    private int totalHistoryEntries;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PatientProfileResponse fromEntity(PatientProfile profile,
                                                     String firstName,
                                                     String lastName,
                                                     String email) {
        PatientProfileResponse resp = new PatientProfileResponse();
        resp.setId(profile.getId());
        resp.setAuthUserId(profile.getAuthUserId());
        String resolvedFirstName = profile.getFirstName() != null && !profile.getFirstName().isBlank()
            ? profile.getFirstName()
            : firstName;
        String resolvedLastName = profile.getLastName() != null && !profile.getLastName().isBlank()
            ? profile.getLastName()
            : lastName;
        String resolvedEmail = profile.getEmail() != null && !profile.getEmail().isBlank()
            ? profile.getEmail()
            : email;

        resp.setFirstName(resolvedFirstName == null ? "" : resolvedFirstName.trim());
        resp.setLastName(resolvedLastName == null ? "" : resolvedLastName.trim());
        resp.setEmail(resolvedEmail == null ? "" : resolvedEmail.trim());
        resp.setDateOfBirth(profile.getDateOfBirth());
        resp.setGender(profile.getGender());
        resp.setBloodGroup(profile.getBloodGroup());
        resp.setAddress(profile.getAddress());
        resp.setEmergencyContactName(profile.getEmergencyContactName());
        resp.setEmergencyContactPhone(profile.getEmergencyContactPhone());
        resp.setAllergies(profile.getAllergies());
        resp.setChronicConditions(profile.getChronicConditions());
        resp.setProfilePictureUrl(
            profile.getProfilePictureUrl() != null && !profile.getProfilePictureUrl().isBlank()
                ? "/api/patients/me/profile-picture"
                : null
        );
        resp.setBio(profile.getBio());
        resp.setTotalReports(profile.getMedicalReports() == null ? 0 : profile.getMedicalReports().size());
        resp.setTotalHistoryEntries(profile.getMedicalHistories() == null ? 0 : profile.getMedicalHistories().size());
        resp.setCreatedAt(profile.getCreatedAt());
        resp.setUpdatedAt(profile.getUpdatedAt());
        return resp;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAuthUserId() { return authUserId; }
    public void setAuthUserId(Long authUserId) { this.authUserId = authUserId; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public Gender getGender() { return gender; }
    public void setGender(Gender gender) { this.gender = gender; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }

    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }

    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }

    public String getChronicConditions() { return chronicConditions; }
    public void setChronicConditions(String chronicConditions) { this.chronicConditions = chronicConditions; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public int getTotalReports() { return totalReports; }
    public void setTotalReports(int totalReports) { this.totalReports = totalReports; }

    public int getTotalHistoryEntries() { return totalHistoryEntries; }
    public void setTotalHistoryEntries(int totalHistoryEntries) { this.totalHistoryEntries = totalHistoryEntries; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
