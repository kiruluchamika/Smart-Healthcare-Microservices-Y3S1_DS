package com.smarthealthcare.ai_doctor_suggestion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SuggestDoctorRequest {

    @NotNull(message = "patientId is required")
    private Long patientId;

    @NotBlank(message = "query must not be empty")
    @Size(max = 1000, message = "query must be at most 1000 characters")
    private String query;
}
