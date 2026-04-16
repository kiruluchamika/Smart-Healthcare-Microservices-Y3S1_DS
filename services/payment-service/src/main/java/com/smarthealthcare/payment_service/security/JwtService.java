package com.smarthealthcare.payment_service.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    @Value("${app.jwt.secret:${APP_JWT_SECRET:smart-healthcare-shared-jwt-secret-change-this-in-production-must-be-at-least-32-bytes}}")
    private String jwtSecret;

    public Claims validateAndGetClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenValid(String token) {
        try {
            validateAndGetClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    public String extractRole(Claims claims) {
        return claims.get("role", String.class);
    }

    public Long extractUserId(Claims claims) {
        Number userId = claims.get("userId", Number.class);
        return userId == null ? null : userId.longValue();
    }

    public String extractEmail(Claims claims) {
        return claims.getSubject();
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }
}
