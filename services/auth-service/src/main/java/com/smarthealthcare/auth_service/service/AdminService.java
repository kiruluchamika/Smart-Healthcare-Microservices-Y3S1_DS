package com.smarthealthcare.auth_service.service;

import com.smarthealthcare.auth_service.dto.admin.AdminOverviewResponse;
import com.smarthealthcare.auth_service.dto.admin.AdminSystemSettingsResponse;
import com.smarthealthcare.auth_service.dto.admin.AdminSystemSettingsUpdateRequest;
import com.smarthealthcare.auth_service.dto.admin.AdminUserItemResponse;
import com.smarthealthcare.auth_service.dto.admin.AdminUsersResponse;
import com.smarthealthcare.auth_service.entity.User;
import com.smarthealthcare.auth_service.entity.UserRole;
import com.smarthealthcare.auth_service.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final AtomicReference<AdminSystemSettingsResponse> settingsRef;

    public AdminService(UserRepository userRepository) {
        this.userRepository = userRepository;

        AdminSystemSettingsResponse defaultSettings = new AdminSystemSettingsResponse();
        defaultSettings.setSessionTimeoutMinutes(15);
        defaultSettings.setMaintenanceMode(false);
        defaultSettings.setRegistrationsEnabled(true);
        this.settingsRef = new AtomicReference<>(defaultSettings);
    }

    public AdminOverviewResponse getOverview() {
        List<User> users = userRepository.findAll();

        long totalUsers = users.size();
        long adminUsers = users.stream().filter(user -> user.getRole() == UserRole.ADMIN).count();
        long doctorUsers = users.stream().filter(user -> user.getRole() == UserRole.DOCTOR).count();
        long patientUsers = users.stream().filter(user -> user.getRole() == UserRole.PATIENT).count();
        long enabledUsers = users.stream().filter(User::isEnabled).count();

        AdminOverviewResponse response = new AdminOverviewResponse();
        response.setTotalUsers(totalUsers);
        response.setAdminUsers(adminUsers);
        response.setDoctorUsers(doctorUsers);
        response.setPatientUsers(patientUsers);
        response.setEnabledUsers(enabledUsers);
        response.setDisabledUsers(totalUsers - enabledUsers);

        return response;
    }

    public AdminUsersResponse getUsers(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);

        Pageable pageable = PageRequest.of(safePage, safeSize);
        Page<User> userPage = userRepository.findAll(pageable);

        AdminUsersResponse response = new AdminUsersResponse();
        response.setItems(userPage.getContent().stream().map(AdminUserItemResponse::fromEntity).toList());
        response.setPage(userPage.getNumber());
        response.setSize(userPage.getSize());
        response.setTotalElements(userPage.getTotalElements());
        response.setTotalPages(userPage.getTotalPages());

        return response;
    }

    @Transactional
    public AdminUserItemResponse updateUserStatus(Long userId, boolean enabled, boolean accountNonLocked) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setEnabled(enabled);
        user.setAccountNonLocked(accountNonLocked);

        User updatedUser = userRepository.save(user);
        return AdminUserItemResponse.fromEntity(updatedUser);
    }

    public AdminSystemSettingsResponse getSystemSettings() {
        return copySettings(settingsRef.get());
    }

    public AdminSystemSettingsResponse updateSystemSettings(AdminSystemSettingsUpdateRequest request) {
        AdminSystemSettingsResponse updated = new AdminSystemSettingsResponse();
        updated.setSessionTimeoutMinutes(request.getSessionTimeoutMinutes());
        updated.setMaintenanceMode(request.getMaintenanceMode());
        updated.setRegistrationsEnabled(request.getRegistrationsEnabled());

        settingsRef.set(updated);
        return copySettings(updated);
    }

    private AdminSystemSettingsResponse copySettings(AdminSystemSettingsResponse source) {
        AdminSystemSettingsResponse copy = new AdminSystemSettingsResponse();
        copy.setSessionTimeoutMinutes(source.getSessionTimeoutMinutes());
        copy.setMaintenanceMode(source.isMaintenanceMode());
        copy.setRegistrationsEnabled(source.isRegistrationsEnabled());
        return copy;
    }
}
