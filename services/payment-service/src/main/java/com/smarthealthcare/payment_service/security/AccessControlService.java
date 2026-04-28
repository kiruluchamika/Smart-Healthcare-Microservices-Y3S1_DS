package com.smarthealthcare.payment_service.security;

import com.smarthealthcare.payment_service.client.DoctorClient;
import com.smarthealthcare.payment_service.dto.integration.DoctorSnapshot;
import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AccessControlService {

    private final JwtService jwtService;
    private final DoctorClient doctorClient;

    public AccessControlService(JwtService jwtService, DoctorClient doctorClient) {
        this.jwtService = jwtService;
        this.doctorClient = doctorClient;
    }

    public Long requirePatientAccess(String authorizationHeader, Long patientId) {
        Claims claims = requireRole(authorizationHeader, "PATIENT");
        Long tokenUserId = jwtService.extractUserId(claims);
        if (tokenUserId == null || !tokenUserId.equals(patientId)) {
            throw new ForbiddenException("Patient access is required for this payment operation");
        }
        return tokenUserId;
    }

    public Long requireDoctorAccess(String authorizationHeader, Long doctorId) {
        Claims claims = requireRole(authorizationHeader, "DOCTOR");
        if (doctorId == null) {
            throw new ForbiddenException("Doctor access is required for this payment operation");
        }

        String tokenEmail = jwtService.extractEmail(claims);
        if (!StringUtils.hasText(tokenEmail)) {
            throw new ForbiddenException("Doctor access is required for this payment operation");
        }

        DoctorSnapshot doctor = doctorClient.getDoctorByEmail(tokenEmail);
        if (doctor == null || doctor.id() == null || !doctor.id().equals(doctorId)) {
            throw new ForbiddenException("Doctor access is required for this payment operation");
        }

        return doctor.id();
    }

    public void requireAdminAccess(String authorizationHeader) {
        requireRole(authorizationHeader, "ADMIN");
    }

    public Claims requireRole(String authorizationHeader, String expectedRole) {
        if (!StringUtils.hasText(authorizationHeader) || !authorizationHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Missing or invalid bearer token");
        }

        String token = authorizationHeader.substring(7).trim();
        if (!StringUtils.hasText(token)) {
            throw new UnauthorizedException("Missing or invalid bearer token");
        }

        Claims claims = jwtService.validateAndGetClaims(token);
        String role = jwtService.extractRole(claims);
        if (!expectedRole.equals(role)) {
            throw new ForbiddenException(expectedRole + " access is required");
        }
        return claims;
    }
}
