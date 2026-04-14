package com.smarthealthcare.patient_service.dto;

public class AppointmentAccessResponse {

    private boolean hasAccess;

    public AppointmentAccessResponse() {
    }

    public boolean isHasAccess() {
        return hasAccess;
    }

    public void setHasAccess(boolean hasAccess) {
        this.hasAccess = hasAccess;
    }
}