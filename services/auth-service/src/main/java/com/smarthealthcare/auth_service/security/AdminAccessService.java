package com.smarthealthcare.auth_service.security;

import com.smarthealthcare.auth_service.entity.UserRole;
import com.smarthealthcare.auth_service.exception.ForbiddenException;
import com.smarthealthcare.auth_service.exception.UnauthorizedException;
import com.smarthealthcare.auth_service.service.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AdminAccessService {

    private final JwtService jwtService;

    public AdminAccessService(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public void requireAdmin(String authorizationHeader) {
        if (!StringUtils.hasText(authorizationHeader) || !authorizationHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Missing or invalid bearer token");
        }

        String token = authorizationHeader.substring(7).trim();
        if (!StringUtils.hasText(token)) {
            throw new UnauthorizedException("Missing or invalid bearer token");
        }

        Claims claims = jwtService.validateAndGetClaims(token);
        String role = jwtService.extractRole(claims);

        if (!UserRole.ADMIN.name().equals(role)) {
            throw new ForbiddenException("Admin access is required");
        }
    }
}
