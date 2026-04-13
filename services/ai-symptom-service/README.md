# AI Symptom Service

`ai-symptom-service` is a Spring Boot microservice that acts as a symptom triage and recommendation assistant for the Smart Healthcare microservices project. It accepts symptom input, sends a structured prompt to Google Gemini, returns triage-oriented JSON, and stores symptom analysis history in MySQL for later retrieval and integration.

## 1. Microservice Responsibilities

This service owns:

- Symptom triage request validation
- Prompt construction for Gemini
- Safe AI response parsing and normalization
- Triage-oriented JSON response generation
- Symptom analysis history persistence
- Safety fallback behavior when Gemini is unavailable
- Retrieval of past analysis history by patient

This service does not own:

- Final medical diagnosis
- Medicine prescription or dosage advice
- Patient profile master data management
- Doctor directory management
- Appointment booking execution
- Emergency dispatch or ambulance workflows

## 2. Recommended Endpoints

- `POST /api/v1/ai-symptoms/analyze`
- `GET /api/v1/ai-symptoms/history/{patientId}`
- `GET /api/v1/ai-symptoms/{id}`
- `GET /api/v1/ai-symptoms/health`

## 3. API Contracts

### Analyze Request DTO

Class: `AnalyzeSymptomRequest`

Fields:

- `patientId` `Long` `@NotNull @Positive`
- `symptomsText` `String` `@NotBlank @Size(min = 10, max = 3000)`
- `age` `Integer` `@NotNull @Min(0) @Max(120)`
- `sex` `String` `@NotBlank @Pattern(^(MALE|FEMALE|OTHER|PREFER_NOT_TO_SAY)$)`
- `durationHours` `Integer` `@NotNull @Min(0) @Max(8760)`
- `chronicConditions` `List<String>` `@Size(max = 20)`
- `currentMedications` `List<String>` `@Size(max = 30)`
- `allergies` `List<String>` `@Size(max = 30)`
- `locale` `String` `@Pattern(^[a-z]{2}(-[A-Z]{2})?$)`

Example request:

```json
{
  "patientId": 101,
  "symptomsText": "I have had fever, sore throat, body aches, and a dry cough for two days.",
  "age": 28,
  "sex": "FEMALE",
  "durationHours": 48,
  "chronicConditions": ["Asthma"],
  "currentMedications": ["Salbutamol inhaler"],
  "allergies": ["Penicillin"],
  "locale": "en-US"
}
```

### Analyze Response DTO

Class: `AnalyzeSymptomResponse`

Fields:

- `analysisId`
- `patientId`
- `symptomSummary`
- `possibleConditionCategories`
- `urgencyLevel`
- `recommendedDoctorSpecialization`
- `redFlagWarningSigns`
- `nextStepRecommendation`
- `disclaimer`
- `generatedAt`
- `provider`
- `model`
- `correlationId`
- `fallbackUsed`

Example response:

```json
{
  "analysisId": 15,
  "patientId": 101,
  "symptomSummary": "The symptoms suggest an upper respiratory illness pattern with fever and throat irritation.",
  "possibleConditionCategories": [
    "Infection-related",
    "Respiratory",
    "ENT"
  ],
  "urgencyLevel": "MODERATE",
  "recommendedDoctorSpecialization": "General Physician",
  "redFlagWarningSigns": [
    "Shortness of breath",
    "Persistent high fever",
    "Confusion"
  ],
  "nextStepRecommendation": "Arrange a medical review within 24 hours and seek urgent care sooner if breathing becomes difficult.",
  "disclaimer": "This triage output is for informational purposes only and is not a medical diagnosis.",
  "generatedAt": "2026-04-13T12:30:00Z",
  "provider": "GEMINI",
  "model": "gemini-1.5-pro",
  "correlationId": "3d9734c6-59d6-4c6e-a7cd-d6a5a2d79f4f",
  "fallbackUsed": false
}
```

### History Response DTOs

- `PagedHistoryResponse`
- `SymptomHistoryItemResponse`

These provide paginated analysis history for a patient and single-item retrieval by analysis id.

## 4. Database Design

Table: `symptom_analysis_history`

Columns:

- `id`
- `patient_id`
- `symptoms_text`
- `age`
- `sex`
- `duration_hours`
- `chronic_conditions_json`
- `medications_json`
- `allergies_json`
- `symptom_summary`
- `condition_categories_json`
- `urgency_level`
- `recommended_specialization`
- `red_flags_json`
- `next_step_recommendation`
- `disclaimer`
- `ai_provider`
- `ai_model`
- `raw_ai_response_json`
- `correlation_id`
- `created_at`
- `updated_at`

SQL schema is defined in `src/main/resources/db/schema.sql`.

Entity class: `SymptomAnalysisHistory`

## 5. Package Structure

```text
com.smarthealthcare.ai_symptom_service
+-- client
+-- config
+-- controller
+-- dto
|   +-- provider
+-- entity
+-- enums
+-- exception
+-- mapper
+-- repository
+-- service
```

## 6. Gemini Integration Flow

1. `AiSymptomController` receives a validated REST request.
2. `SymptomAnalysisService` creates a correlation id and builds prompts.
3. `GeminiClient` sends the prompt to Gemini using the configured API key.
4. Gemini is asked to return JSON only.
5. The service extracts the JSON text, deserializes it into `GeminiTriageResult`, and validates required fields.
6. `SafetyRuleService` normalizes missing fields and overrides dangerous emergency outputs when needed.
7. The final analysis is stored in MySQL.
8. `AnalyzeSymptomResponse` is returned to the caller.

## 7. Prompt Design

System prompt principles:

- Never provide a final diagnosis
- Never prescribe medication or dosage
- Only provide triage-oriented guidance
- Return valid JSON only
- Always include a disclaimer
- Use broad condition categories only

User prompt principles:

- Include patient age, sex, symptom duration, symptoms text, and optional context
- Enforce exact output keys
- Keep urgency values constrained to `LOW`, `MODERATE`, `HIGH`, `EMERGENCY`
- Ask for locale-aware natural-language text where possible

## 8. Spring Boot Implementation Plan

Core classes:

- `AiSymptomController`
- `SymptomAnalysisService`
- `HistoryService`
- `PromptBuilder`
- `SafetyRuleService`
- `GeminiClient`
- `SymptomAnalysisMapper`

Configuration:

- `GeminiProperties`
- `HttpClientConfig`
- `application.yaml`
- `application-docker.yaml`

Persistence:

- `SymptomAnalysisHistory`
- `SymptomAnalysisHistoryRepository`

Recommendation:

- Use `RestTemplate` for this academic project because the integration is simple and synchronous.
- For larger-scale production systems, `WebClient` would be a stronger long-term option for non-blocking outbound AI calls.

Environment variables:

- `GEMINI_API_KEY`
- `GEMINI_BASE_URL`
- `GEMINI_MODEL`
- `GEMINI_TIMEOUT_MS`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`

## 9. Safety Rules

- Validate all incoming request fields
- Reject blank or too-short symptom text
- Force fallback behavior when Gemini is unavailable
- Reject malformed Gemini JSON
- Force disclaimer presence
- Force valid urgency values
- Escalate to `EMERGENCY` when critical symptom keywords are detected
- Never expose the service as a diagnosis engine

Fallback behavior:

- Return safe triage guidance
- Recommend clinical review
- Keep the disclaimer
- Warn users to seek emergency care if symptoms worsen

## 10. Integration Notes

Future integration with `patient-service`:

- Use patient id to link symptom history to the owning patient
- Later validate patient existence through synchronous REST or event-driven integration

Future integration with `doctor-service`:

- Use `recommendedDoctorSpecialization` to request matching doctors
- Later map specialization labels to searchable department or specialty codes

Future integration with `appointment-service`:

- Use urgency and specialization to guide appointment type
- Later trigger appointment suggestions after a successful analysis

## 11. Nice-to-Have Backlog

- Repeated symptom trend tracking for the same patient
- Recommended department list in addition to specialization
- Multilingual response templates
- Doctor recommendation enrichment
- Appointment suggestion orchestration
- Audit logs and metrics dashboards

## Run Locally

1. Ensure Docker Desktop is running.
2. Set `GEMINI_API_KEY`.
3. Start the service from IntelliJ or run Spring Boot locally.
4. Spring Boot will manage the local MySQL container defined in `docker-compose.yaml`.
