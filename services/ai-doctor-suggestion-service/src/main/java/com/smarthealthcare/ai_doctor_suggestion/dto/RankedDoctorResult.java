package com.smarthealthcare.ai_doctor_suggestion.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RankedDoctorResult {

    private DoctorServiceDoctorDto doctor;
    private double semanticScore;
    private double finalScore;
}
