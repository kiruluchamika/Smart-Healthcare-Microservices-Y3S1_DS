package com.smarthealthcare.ai_symptom_service.dto;

import java.time.Instant;
import java.util.List;

public class AnalyzeSymptomResponse {

    private Long analysisId;
    private Long patientId;
    private String symptomSummary;
    private List<String> possibleConditionCategories;
    private String urgencyLevel;
    private String recommendedDoctorSpecialization;
    private List<String> redFlagWarningSigns;
    private String nextStepRecommendation;
    private String disclaimer;
    private Instant generatedAt;
    private String provider;
    private String model;
    private String correlationId;
    private boolean fallbackUsed;

    public Long getAnalysisId() {
        return analysisId;
    }

    public void setAnalysisId(Long analysisId) {
        this.analysisId = analysisId;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public String getSymptomSummary() {
        return symptomSummary;
    }

    public void setSymptomSummary(String symptomSummary) {
        this.symptomSummary = symptomSummary;
    }

    public List<String> getPossibleConditionCategories() {
        return possibleConditionCategories;
    }

    public void setPossibleConditionCategories(List<String> possibleConditionCategories) {
        this.possibleConditionCategories = possibleConditionCategories;
    }

    public String getUrgencyLevel() {
        return urgencyLevel;
    }

    public void setUrgencyLevel(String urgencyLevel) {
        this.urgencyLevel = urgencyLevel;
    }

    public String getRecommendedDoctorSpecialization() {
        return recommendedDoctorSpecialization;
    }

    public void setRecommendedDoctorSpecialization(String recommendedDoctorSpecialization) {
        this.recommendedDoctorSpecialization = recommendedDoctorSpecialization;
    }

    public List<String> getRedFlagWarningSigns() {
        return redFlagWarningSigns;
    }

    public void setRedFlagWarningSigns(List<String> redFlagWarningSigns) {
        this.redFlagWarningSigns = redFlagWarningSigns;
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

    public Instant getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(Instant generatedAt) {
        this.generatedAt = generatedAt;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }

    public boolean isFallbackUsed() {
        return fallbackUsed;
    }

    public void setFallbackUsed(boolean fallbackUsed) {
        this.fallbackUsed = fallbackUsed;
    }
}
