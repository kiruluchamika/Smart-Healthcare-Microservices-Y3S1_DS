package com.smarthealthcare.auth_service.dto.admin;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class AdminSystemSettingsUpdateRequest {
    @NotNull(message = "Session timeout is required")
    @Min(value = 5, message = "Session timeout must be at least 5 minutes")
    @Max(value = 1440, message = "Session timeout cannot exceed 1440 minutes")
    private Integer sessionTimeoutMinutes;

    @NotNull(message = "Maintenance mode flag is required")
    private Boolean maintenanceMode;

    @NotNull(message = "Registrations enabled flag is required")
    private Boolean registrationsEnabled;

    public Integer getSessionTimeoutMinutes() {
        return sessionTimeoutMinutes;
    }

    public void setSessionTimeoutMinutes(Integer sessionTimeoutMinutes) {
        this.sessionTimeoutMinutes = sessionTimeoutMinutes;
    }

    public Boolean getMaintenanceMode() {
        return maintenanceMode;
    }

    public void setMaintenanceMode(Boolean maintenanceMode) {
        this.maintenanceMode = maintenanceMode;
    }

    public Boolean getRegistrationsEnabled() {
        return registrationsEnabled;
    }

    public void setRegistrationsEnabled(Boolean registrationsEnabled) {
        this.registrationsEnabled = registrationsEnabled;
    }
}
