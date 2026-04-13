package com.smarthealthcare.ai_symptom_service.exception;

public class ExternalAiException extends RuntimeException {

    public ExternalAiException(String message) {
        super(message);
    }

    public ExternalAiException(String message, Throwable cause) {
        super(message, cause);
    }
}
