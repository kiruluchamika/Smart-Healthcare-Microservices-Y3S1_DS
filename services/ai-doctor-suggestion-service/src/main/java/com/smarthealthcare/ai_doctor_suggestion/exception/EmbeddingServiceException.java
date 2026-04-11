package com.smarthealthcare.ai_doctor_suggestion.exception;

public class EmbeddingServiceException extends RuntimeException {

    public EmbeddingServiceException(String message) {
        super(message);
    }

    public EmbeddingServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
