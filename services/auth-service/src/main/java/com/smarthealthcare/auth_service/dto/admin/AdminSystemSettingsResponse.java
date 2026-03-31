package com.smarthealthcare.auth_service.dto.admin;

public class AdminSystemSettingsResponse {
    private int sessionTimeoutMinutes;
    private boolean maintenanceMode;
    private boolean registrationsEnabled;

    public int getSessionTimeoutMinutes() {
        return sessionTimeoutMinutes;
    }

    public void setSessionTimeoutMinutes(int sessionTimeoutMinutes) {
        this.sessionTimeoutMinutes = sessionTimeoutMinutes;
    }

    public boolean isMaintenanceMode() {
        return maintenanceMode;
    }

    public void setMaintenanceMode(boolean maintenanceMode) {
        this.maintenanceMode = maintenanceMode;
    }

    public boolean isRegistrationsEnabled() {
        return registrationsEnabled;
    }

    public void setRegistrationsEnabled(boolean registrationsEnabled) {
        this.registrationsEnabled = registrationsEnabled;
    }
}
