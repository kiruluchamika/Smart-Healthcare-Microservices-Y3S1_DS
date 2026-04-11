package com.smarthealthcare.ai_doctor_suggestion.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DoctorSuggestionDto {

    private Long doctorId;
    private String doctorName;
    private String specialization;
    private Integer experienceYears;
    private String verificationStatus;
    private String nextAvailableSlot;
    private Double semanticScore;
    private Double finalScore;
}
