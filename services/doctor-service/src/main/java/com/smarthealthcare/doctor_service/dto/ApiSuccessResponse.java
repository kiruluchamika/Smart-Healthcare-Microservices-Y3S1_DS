package com.smarthealthcare.doctor_service.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ApiSuccessResponse {
    String message;
}
