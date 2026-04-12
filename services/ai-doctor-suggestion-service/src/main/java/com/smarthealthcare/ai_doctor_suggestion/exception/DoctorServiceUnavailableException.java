package com.smarthealthcare.ai_doctor_suggestion.exception;

public class DoctorServiceUnavailableException extends RuntimeException {

    public DoctorServiceUnavailableException(String message) {
        super(message);
    }

    public DoctorServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
