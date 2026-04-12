package com.smarthealthcare.ai_symptom_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "symptom_analysis_history")
public class SymptomAnalysisHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String symptomsText;

    @Column(nullable = false)
    private Integer age;

    @Column(nullable = false, length = 32)
    private String sex;

    @Column(nullable = false)
    private Integer durationHours;

    @Column(columnDefinition = "TEXT")
    private String chronicConditionsJson;

    @Column(columnDefinition = "TEXT")
    private String medicationsJson;

    @Column(columnDefinition = "TEXT")
    private String allergiesJson;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String symptomSummary;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String conditionCategoriesJson;

    @Column(nullable = false, length = 20)
    private String urgencyLevel;

    @Column(nullable = false, length = 120)
    private String recommendedSpecialization;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String redFlagsJson;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String nextStepRecommendation;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String disclaimer;

    @Column(nullable = false, length = 32)
    private String aiProvider;

    @Column(nullable = false, length = 64)
    private String aiModel;

    @Column(columnDefinition = "TEXT")
    private String rawAiResponseJson;

    @Column(length = 64)
    private String correlationId;

    @Column(nullable = false)
    private Instant createdAt;

    @Column
    private Instant updatedAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public String getChronicConditionsJson() {
        return chronicConditionsJson;
    }

    public void setChronicConditionsJson(String chronicConditionsJson) {
        this.chronicConditionsJson = chronicConditionsJson;
    }

    public String getMedicationsJson() {
        return medicationsJson;
    }

    public void setMedicationsJson(String medicationsJson) {
        this.medicationsJson = medicationsJson;
    }

    public String getAllergiesJson() {
        return allergiesJson;
    }

    public void setAllergiesJson(String allergiesJson) {
        this.allergiesJson = allergiesJson;
    }

    public String getSymptomSummary() {
        return symptomSummary;
    }

    public void setSymptomSummary(String symptomSummary) {
        this.symptomSummary = symptomSummary;
    }

    public String getConditionCategoriesJson() {
        return conditionCategoriesJson;
    }

    public void setConditionCategoriesJson(String conditionCategoriesJson) {
        this.conditionCategoriesJson = conditionCategoriesJson;
    }

    public String getUrgencyLevel() {
        return urgencyLevel;
    }

    public void setUrgencyLevel(String urgencyLevel) {
        this.urgencyLevel = urgencyLevel;
    }

    public String getRecommendedSpecialization() {
        return recommendedSpecialization;
    }

    public void setRecommendedSpecialization(String recommendedSpecialization) {
        this.recommendedSpecialization = recommendedSpecialization;
    }

    public String getRedFlagsJson() {
        return redFlagsJson;
    }

    public void setRedFlagsJson(String redFlagsJson) {
        this.redFlagsJson = redFlagsJson;
    }

    public String getNextStepRecommendation() {
        return nextStepRecommendation;
    }

    public void setNextStepRecommendation(String nextStepRecommendation) {
        this.nextStepRecommendation = nextStepRecommendation;
    }

    public String getDisclaimer() {
        return disclaimer;
    }

    public void setDisclaimer(String disclaimer) {
        this.disclaimer = disclaimer;
    }

    public String getAiProvider() {
        return aiProvider;
    }

    public void setAiProvider(String aiProvider) {
        this.aiProvider = aiProvider;
    }

    public String getAiModel() {
        return aiModel;
    }

    public void setAiModel(String aiModel) {
        this.aiModel = aiModel;
    }

    public String getRawAiResponseJson() {
        return rawAiResponseJson;
    }

    public void setRawAiResponseJson(String rawAiResponseJson) {
        this.rawAiResponseJson = rawAiResponseJson;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
