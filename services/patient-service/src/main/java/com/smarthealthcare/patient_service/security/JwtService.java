package com.smarthealthcare.patient_service.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
public class JwtService {

    @Value("${app.jwt.secret:your-secret-key-change-this-in-production-must-be-at-least-256-bits-long-for-HS256-algorithm-security}")
    private String jwtSecret;

    public Claims validateAndGetClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long extractUserId(Claims claims) {
        Object userId = claims.get("userId");
        if (userId instanceof Integer) {
            return ((Integer) userId).longValue();
        } else if (userId instanceof Long) {
            return (Long) userId;
        }
        return null;
    }

    public String extractRole(Claims claims) {
        return claims.get("role", String.class);
    }
    
    public String extractFirstName(Claims claims) {
        return claims.get("firstName", String.class);
    }
    
    public String extractLastName(Claims claims) {
        return claims.get("lastName", String.class);
    }

    public String extractEmail(Claims claims) {
        return claims.getSubject();
    }

    public boolean isTokenValid(String token) {
        try {
            validateAndGetClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }
}
