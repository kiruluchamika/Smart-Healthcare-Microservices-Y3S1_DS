package com.smarthealthcare.ai_doctor_suggestion.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SuggestDoctorResponse {

    private String query;
    private String recommendedSpecialty;
    private String explanation;
    private List<DoctorSuggestionDto> topDoctors;
}
