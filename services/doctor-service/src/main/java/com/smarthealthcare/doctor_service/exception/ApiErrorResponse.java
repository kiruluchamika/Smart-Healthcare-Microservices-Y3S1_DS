package com.smarthealthcare.doctor_service.exception;

import java.time.LocalDateTime;
import java.util.Map;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ApiErrorResponse {
    LocalDateTime timestamp;
    int status;
    String error;
    String message;
    String path;
    String traceId;
    Map<String, String> fieldErrors;
}
