package com.smarthealthcare.ai_doctor_suggestion.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class DoctorServiceDoctorDto {

    private Long id;
    private String firstName;
    private String lastName;
    private String specialization;
    private String qualifications;
    private String bio;
    private Integer experienceYears;
    private String verificationStatus;
    private Boolean available;
    private String nextAvailableSlot;
}
