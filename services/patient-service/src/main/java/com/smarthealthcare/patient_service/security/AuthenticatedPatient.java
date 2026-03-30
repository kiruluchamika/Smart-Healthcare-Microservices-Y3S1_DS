package com.smarthealthcare.patient_service.security;

/**
 * Represents the currently authenticated patient extracted from JWT.
 * Stored as the Principal in SecurityContext.
 */
public class AuthenticatedPatient {

    private final Long authUserId;
    private final String email;
    private final String role;
    private final String firstName;
    private final String lastName;

    public AuthenticatedPatient(Long authUserId, String email, String role, String firstName, String lastName) {
        this.authUserId = authUserId;
        this.email = email;
        this.role = role;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public Long getAuthUserId() { return authUserId; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }

    @Override
    public String toString() {
        return "AuthenticatedPatient{authUserId=" + authUserId + ", email='" + email + "', role='" + role + "'}";
    }
}
