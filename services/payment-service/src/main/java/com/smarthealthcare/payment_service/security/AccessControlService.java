package com.smarthealthcare.payment_service.security;

import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AccessControlService {

    private final JwtService jwtService;

    public AccessControlService(JwtService jwtService) {
        this.jwtService = jwtService;
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
        Long tokenUserId = jwtService.extractUserId(claims);
        if (tokenUserId == null || !tokenUserId.equals(doctorId)) {
            throw new ForbiddenException("Doctor access is required for this payment operation");
        }
        return tokenUserId;
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