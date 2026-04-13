package com.smarthealthcare.ai_symptom_service.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

public class AnalyzeSymptomRequest {

    @NotNull
    @Positive
    private Long patientId;

    @NotBlank
    @Size(min = 10, max = 3000)
    private String symptomsText;

    @NotNull
    @Min(0)
    @Max(120)
    private Integer age;

    @NotBlank
    @Pattern(regexp = "^(MALE|FEMALE|OTHER|PREFER_NOT_TO_SAY)$")
    private String sex;

    @NotNull
    @Min(0)
    @Max(8760)
    private Integer durationHours;

    @Size(max = 20)
    private List<@Size(max = 100) String> chronicConditions;

    @Size(max = 30)
    private List<@Size(max = 120) String> currentMedications;

    @Size(max = 30)
    private List<@Size(max = 120) String> allergies;

    @Pattern(regexp = "^[a-z]{2}(-[A-Z]{2})?$")
    private String locale;

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public String getSymptomsText() {
        return symptomsText;
    }

    public void setSymptomsText(String symptomsText) {
        this.symptomsText = symptomsText;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getSex() {
        return sex;
    }

    public void setSex(String sex) {
        this.sex = sex;
    }

    public Integer getDurationHours() {
        return durationHours;
    }

    public void setDurationHours(Integer durationHours) {
        this.durationHours = durationHours;
    }

    public List<String> getChronicConditions() {
        return chronicConditions;
    }

    public void setChronicConditions(List<String> chronicConditions) {
        this.chronicConditions = chronicConditions;
    }

    public List<String> getCurrentMedications() {
        return currentMedications;
    }

    public void setCurrentMedications(List<String> currentMedications) {
        this.currentMedications = currentMedications;
    }

    public List<String> getAllergies() {
        return allergies;
    }

    public void setAllergies(List<String> allergies) {
        this.allergies = allergies;
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }
}
