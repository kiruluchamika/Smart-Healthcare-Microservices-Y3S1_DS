package com.smarthealthcare.patient_service.dto;

public class PatientContactResponse {

    private Long authUserId;
    private Long patientProfileId;
    private String firstName;
    private String lastName;
    private String email;
    private String contactPhone;

    public static PatientContactResponse fromProfile(PatientProfileResponse profile) {
        PatientContactResponse response = new PatientContactResponse();
        response.setAuthUserId(profile.getAuthUserId());
        response.setPatientProfileId(profile.getId());
        response.setFirstName(profile.getFirstName());
        response.setLastName(profile.getLastName());
        response.setEmail(profile.getEmail());
        response.setContactPhone(profile.getEmergencyContactPhone());
        return response;
    }

    public Long getAuthUserId() {
        return authUserId;
    }

    public void setAuthUserId(Long authUserId) {
        this.authUserId = authUserId;
    }

    public Long getPatientProfileId() {
        return patientProfileId;
    }

    public void setPatientProfileId(Long patientProfileId) {
        this.patientProfileId = patientProfileId;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }
}