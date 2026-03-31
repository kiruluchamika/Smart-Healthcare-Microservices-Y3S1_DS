package com.smarthealthcare.appointment_service.dto.response;

import java.time.LocalDateTime;

public class ApiMessageResponse {

    private String message;
    private LocalDateTime timestamp;

    public ApiMessageResponse() {
        this.timestamp = LocalDateTime.now();
    }

    public ApiMessageResponse(String message) {
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
