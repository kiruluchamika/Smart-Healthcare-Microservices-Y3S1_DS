package com.smarthealthcare.ai_symptom_service.service;

import com.smarthealthcare.ai_symptom_service.dto.AnalyzeSymptomRequest;
import org.springframework.stereotype.Component;

@Component
public class PromptBuilder {

    public String systemPrompt() {
        return "You are a healthcare symptom triage assistant for an academic software project. "
                + "You must NOT provide a final diagnosis. "
                + "You must NOT prescribe medication or dosage. "
                + "You must provide triage-style guidance only and output JSON only. "
                + "Always include disclaimer text saying this is not a medical diagnosis. "
                + "If severe emergency warning signs are present, urgencyLevel must be EMERGENCY with immediate emergency next-step advice.";
    }

    public String userPrompt(AnalyzeSymptomRequest request) {
        return "Patient input:\n"
                + "patientId: " + request.getPatientId() + "\n"
                + "age: " + request.getAge() + "\n"
                + "sex: " + request.getSex() + "\n"
                + "durationHours: " + request.getDurationHours() + "\n"
                + "symptomsText: " + request.getSymptomsText() + "\n"
                + "chronicConditions: " + safe(request.getChronicConditions()) + "\n"
                + "currentMedications: " + safe(request.getCurrentMedications()) + "\n"
                + "allergies: " + safe(request.getAllergies()) + "\n"
                + "locale: " + (request.getLocale() == null ? "en-US" : request.getLocale()) + "\n\n"
                + "Return JSON object with EXACT keys:\n"
                + "symptomSummary (string),\n"
                + "possibleConditionCategories (array of string),\n"
                + "urgencyLevel (one of LOW, MODERATE, HIGH, EMERGENCY),\n"
                + "recommendedDoctorSpecialization (string),\n"
                + "redFlagWarningSigns (array of string),\n"
                + "nextStepRecommendation (string),\n"
                + "disclaimer (string).\n"
                + "No markdown, no explanation outside JSON.";
    }

    private String safe(Object value) {
        return value == null ? "[]" : value.toString();
    }
}
