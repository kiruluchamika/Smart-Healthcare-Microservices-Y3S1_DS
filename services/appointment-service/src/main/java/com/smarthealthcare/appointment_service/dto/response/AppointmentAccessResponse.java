package com.smarthealthcare.appointment_service.dto.response;

public class AppointmentAccessResponse {

    private boolean hasAccess;

    public AppointmentAccessResponse() {
    }

    public AppointmentAccessResponse(boolean hasAccess) {
        this.hasAccess = hasAccess;
    }

    public boolean isHasAccess() {
        return hasAccess;
    }

    public void setHasAccess(boolean hasAccess) {
        this.hasAccess = hasAccess;
    }
}