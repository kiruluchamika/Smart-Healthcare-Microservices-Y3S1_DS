package com.smarthealthcare.auth_service.controller;

import com.smarthealthcare.auth_service.dto.AuthResponse;
import com.smarthealthcare.auth_service.dto.LoginRequest;
import com.smarthealthcare.auth_service.dto.RegisterRequest;
import com.smarthealthcare.auth_service.dto.UserResponse;
import com.smarthealthcare.auth_service.dto.admin.AdminOverviewResponse;
import com.smarthealthcare.auth_service.dto.admin.AdminSystemSettingsResponse;
import com.smarthealthcare.auth_service.dto.admin.AdminSystemSettingsUpdateRequest;
import com.smarthealthcare.auth_service.dto.admin.AdminUserItemResponse;
import com.smarthealthcare.auth_service.dto.admin.AdminUserStatusUpdateRequest;
import com.smarthealthcare.auth_service.dto.admin.AdminUsersResponse;
import com.smarthealthcare.auth_service.security.AdminAccessService;
import com.smarthealthcare.auth_service.service.AdminService;
import com.smarthealthcare.auth_service.service.AuthService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final AdminService adminService;
    private final AdminAccessService adminAccessService;

    public AuthController(AuthService authService, AdminService adminService, AdminAccessService adminAccessService) {
        this.authService = authService;
        this.adminService = adminService;
        this.adminAccessService = adminAccessService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/login")
    public ResponseEntity<AuthResponse> adminLogin(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.adminLogin(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long userId) {
        return ResponseEntity.ok(authService.getUserById(userId));
    }

    @GetMapping("/admin/overview")
    public ResponseEntity<AdminOverviewResponse> getAdminOverview(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        adminAccessService.requireAdmin(authorizationHeader);
        return ResponseEntity.ok(adminService.getOverview());
    }

    @GetMapping("/admin/users")
    public ResponseEntity<AdminUsersResponse> getUsers(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        adminAccessService.requireAdmin(authorizationHeader);
        return ResponseEntity.ok(adminService.getUsers(page, size));
    }

    @PatchMapping("/admin/users/{userId}/status")
    public ResponseEntity<AdminUserItemResponse> updateUserStatus(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long userId,
            @Valid @RequestBody AdminUserStatusUpdateRequest request
    ) {
        adminAccessService.requireAdmin(authorizationHeader);
        AdminUserItemResponse response = adminService.updateUserStatus(
                userId,
                request.getEnabled(),
                request.getAccountNonLocked()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/settings")
    public ResponseEntity<AdminSystemSettingsResponse> getSystemSettings(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        adminAccessService.requireAdmin(authorizationHeader);
        return ResponseEntity.ok(adminService.getSystemSettings());
    }

    @PutMapping("/admin/settings")
    public ResponseEntity<AdminSystemSettingsResponse> updateSystemSettings(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @Valid @RequestBody AdminSystemSettingsUpdateRequest request
    ) {
        adminAccessService.requireAdmin(authorizationHeader);
        return ResponseEntity.ok(adminService.updateSystemSettings(request));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "auth-service"));
    }
}
