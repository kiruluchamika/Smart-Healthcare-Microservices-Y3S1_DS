package com.smarthealthcare.auth_service.dto.admin;

public class AdminOverviewResponse {
    private long totalUsers;
    private long adminUsers;
    private long doctorUsers;
    private long patientUsers;
    private long enabledUsers;
    private long disabledUsers;

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getAdminUsers() {
        return adminUsers;
    }

    public void setAdminUsers(long adminUsers) {
        this.adminUsers = adminUsers;
    }

    public long getDoctorUsers() {
        return doctorUsers;
    }

    public void setDoctorUsers(long doctorUsers) {
        this.doctorUsers = doctorUsers;
    }

    public long getPatientUsers() {
        return patientUsers;
    }

    public void setPatientUsers(long patientUsers) {
        this.patientUsers = patientUsers;
    }

    public long getEnabledUsers() {
        return enabledUsers;
    }

    public void setEnabledUsers(long enabledUsers) {
        this.enabledUsers = enabledUsers;
    }

    public long getDisabledUsers() {
        return disabledUsers;
    }

    public void setDisabledUsers(long disabledUsers) {
        this.disabledUsers = disabledUsers;
    }
}
