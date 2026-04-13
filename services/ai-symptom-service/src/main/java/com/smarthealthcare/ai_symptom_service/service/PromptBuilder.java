package com.smarthealthcare.ai_symptom_service.service;

import com.smarthealthcare.ai_symptom_service.dto.AnalyzeSymptomRequest;
import org.springframework.stereotype.Component;

@Component
public class PromptBuilder {

    public String systemPrompt() {
        return "You are an AI symptom triage assistant for a healthcare microservices academic project. "
                + "Your role is limited to symptom summarization, broad condition category suggestion, urgency triage, "
                + "recommended doctor specialization, red-flag warning signs, next-step guidance, and a disclaimer. "
                + "You must not act as a diagnosis engine. "
                + "You must not claim certainty, provide a final diagnosis, prescribe medicines, suggest dosage, or replace a clinician. "
                + "Possible condition categories must be broad categories only, such as Respiratory, Gastrointestinal, "
                + "Infection-related, Musculoskeletal, Neurological, Cardiovascular, Dermatological, ENT, Urinary, or General Symptom Review. "
                + "Urgency must be exactly one of LOW, MODERATE, HIGH, or EMERGENCY. "
                + "If the symptoms include emergency warning signs, set urgencyLevel to EMERGENCY and recommend immediate emergency care. "
                + "Return one valid JSON object only. "
                + "Do not return markdown, code fences, prose, or explanations outside JSON. "
                + "Always include a disclaimer that clearly says this output is not a medical diagnosis.";
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
                + "Instructions:\n"
                + "- summarize the symptoms in plain patient-friendly language\n"
                + "- provide only broad condition categories, not exact diseases or diagnoses\n"
                + "- do not prescribe medication or dosage\n"
                + "- keep the response suitable for a triage assistant\n"
                + "- if there are emergency signs, urgencyLevel must be EMERGENCY\n"
                + "- write the natural-language fields in the requested locale when possible\n"
                + "- keep urgencyLevel in English enum form\n"
                + "- always include the disclaimer\n\n"
                + "Return JSON object with EXACT keys:\n"
                + "symptomSummary (string),\n"
                + "possibleConditionCategories (array of string),\n"
                + "urgencyLevel (one of LOW, MODERATE, HIGH, EMERGENCY),\n"
                + "recommendedDoctorSpecialization (string),\n"
                + "redFlagWarningSigns (array of string),\n"
                + "nextStepRecommendation (string),\n"
                + "disclaimer (string).\n"
                + "Use up to 5 condition categories and up to 5 red flag warning signs. "
                + "No markdown, no explanation outside JSON.";
    }

    private String safe(Object value) {
        return value == null ? "[]" : value.toString();
    }
}
