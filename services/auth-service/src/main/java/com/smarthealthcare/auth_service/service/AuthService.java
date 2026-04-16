package com.smarthealthcare.auth_service.service;

import com.smarthealthcare.auth_service.dto.AuthResponse;
import com.smarthealthcare.auth_service.dto.LoginRequest;
import com.smarthealthcare.auth_service.dto.RegisterRequest;
import com.smarthealthcare.auth_service.dto.UserResponse;
import com.smarthealthcare.auth_service.entity.User;
import com.smarthealthcare.auth_service.entity.UserRole;
import com.smarthealthcare.auth_service.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final String BCRYPT_PATTERN = "^\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}$";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setPhoneNumber(normalizeOptional(request.getPhoneNumber()));
        user.setRole(request.getRole());

        User savedUser = userRepository.save(user);
        return buildAuthResponse(savedUser);
    }

    public AuthResponse login(LoginRequest request) {
        User user = validateCredentials(request);

        return buildAuthResponse(user);
    }

    public AuthResponse adminLogin(LoginRequest request) {
        User user = validateCredentials(request);

        if (user.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Admin account is required");
        }

        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return UserResponse.fromEntity(user);
    }

    private User validateCredentials(LoginRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String normalizedEmail = normalizeEmail(request.getEmail());
        String rawPassword = request.getPassword();

        if (normalizedEmail == null || normalizedEmail.isBlank() || rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        try {
            User user = userRepository.findByEmail(normalizedEmail)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

            if (!matchesAndUpgradePasswordIfNeeded(user, rawPassword)) {
                throw new IllegalArgumentException("Invalid email or password");
            }

            return user;
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid email or password");
        }
    }

    private boolean matchesAndUpgradePasswordIfNeeded(User user, String rawPassword) {
        String storedHash = user.getPasswordHash();
        if (storedHash == null || storedHash.isBlank()) {
            return false;
        }

        // If legacy plain text is stored (manual seed/insert), accept once and upgrade.
        if (rawPassword.equals(storedHash)) {
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
            return true;
        }

        // Only run BCrypt check for structurally valid BCrypt hashes.
        boolean isValidBcryptHash = storedHash.matches(BCRYPT_PATTERN);
        if (!isValidBcryptHash) {
            return false;
        }

        try {
            return passwordEncoder.matches(rawPassword, storedHash);
        } catch (Exception ex) {
            return false;
        }
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateAccessToken(user);
        AuthResponse response = new AuthResponse();
        response.setAccessToken(token);
        response.setTokenType("Bearer");
        response.setExpiresInMs(jwtService.getAccessTokenExpirationMs());
        response.setUser(UserResponse.fromEntity(user));
        return response;
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
