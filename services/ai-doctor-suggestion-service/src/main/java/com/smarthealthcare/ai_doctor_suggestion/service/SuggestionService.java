package com.smarthealthcare.ai_doctor_suggestion.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smarthealthcare.ai_doctor_suggestion.client.DoctorServiceClient;
import com.smarthealthcare.ai_doctor_suggestion.dto.DoctorServiceDoctorDto;
import com.smarthealthcare.ai_doctor_suggestion.dto.DoctorSuggestionDto;
import com.smarthealthcare.ai_doctor_suggestion.dto.RankedDoctorResult;
import com.smarthealthcare.ai_doctor_suggestion.dto.SuggestDoctorRequest;
import com.smarthealthcare.ai_doctor_suggestion.dto.SuggestDoctorResponse;
import com.smarthealthcare.ai_doctor_suggestion.entity.DoctorEmbeddingCache;
import com.smarthealthcare.ai_doctor_suggestion.entity.SuggestionLog;
import com.smarthealthcare.ai_doctor_suggestion.exception.BadRequestException;
import com.smarthealthcare.ai_doctor_suggestion.exception.EmbeddingServiceException;
import com.smarthealthcare.ai_doctor_suggestion.repository.DoctorEmbeddingCacheRepository;
import com.smarthealthcare.ai_doctor_suggestion.repository.SuggestionLogRepository;
import com.smarthealthcare.ai_doctor_suggestion.util.CosineSimilarityUtil;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class SuggestionService {

    private final DoctorServiceClient doctorServiceClient;
    private final EmbeddingService embeddingService;
    private final RankingService rankingService;
    private final DoctorEmbeddingCacheRepository doctorEmbeddingCacheRepository;
    private final SuggestionLogRepository suggestionLogRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public SuggestDoctorResponse suggestDoctors(SuggestDoctorRequest request) {
        if (!StringUtils.hasText(request.getQuery())) {
            throw new BadRequestException("Query must not be empty");
        }

        List<Double> patientEmbedding = embeddingService.generateEmbedding(request.getQuery().trim());
        List<DoctorServiceDoctorDto> doctors = doctorServiceClient.fetchVerifiedDoctors();

        if (doctors.isEmpty()) {
            throw new BadRequestException("No verified doctors available for suggestion");
        }

        List<RankedDoctorResult> rankedResults = new ArrayList<>();
        for (DoctorServiceDoctorDto doctor : doctors) {
            try {
                String sourceText = buildDoctorSourceText(doctor);
                List<Double> doctorEmbedding = resolveDoctorEmbedding(doctor.getId(), sourceText);
                double semanticScore = CosineSimilarityUtil.cosineSimilarity(patientEmbedding, doctorEmbedding);
                double finalScore = rankingService.calculateFinalScore(semanticScore, doctor);

                rankedResults.add(RankedDoctorResult.builder()
                        .doctor(doctor)
                        .semanticScore(round(semanticScore))
                        .finalScore(round(finalScore))
                        .build());
            } catch (EmbeddingServiceException ex) {
                throw ex;
            } catch (Exception ex) {
                // Skip problematic doctor records and continue ranking for remaining doctors.
            }
        }

        if (rankedResults.isEmpty()) {
            throw new BadRequestException("Could not rank doctors for the provided query");
        }

        List<RankedDoctorResult> topResults = rankedResults.stream()
                .sorted(Comparator.comparingDouble(RankedDoctorResult::getFinalScore).reversed())
                .limit(3)
                .toList();

        String recommendedSpecialty = deriveRecommendedSpecialty(topResults);
        String explanation = buildResponseExplanation(recommendedSpecialty, topResults);

        List<DoctorSuggestionDto> topDoctors = topResults.stream()
                .map(this::toDoctorSuggestionDto)
                .toList();

        suggestionLogRepository.save(SuggestionLog.builder()
                .patientId(request.getPatientId())
                .queryText(request.getQuery())
                .recommendedSpecialty(recommendedSpecialty)
                .explanation(explanation)
                .build());

        return SuggestDoctorResponse.builder()
                .query(request.getQuery())
                .recommendedSpecialty(recommendedSpecialty)
                .explanation(explanation)
                .topDoctors(topDoctors)
                .build();
    }

    private List<Double> resolveDoctorEmbedding(Long doctorId, String sourceText) {
        Optional<DoctorEmbeddingCache> cacheOptional = doctorEmbeddingCacheRepository.findByDoctorId(doctorId);

        if (cacheOptional.isPresent()) {
            DoctorEmbeddingCache cache = cacheOptional.get();
            if (Objects.equals(cache.getSourceText(), sourceText)) {
                return parseEmbedding(cache.getEmbeddingJson());
            }

            List<Double> embedding = embeddingService.generateEmbedding(sourceText);
            cache.setSourceText(sourceText);
            cache.setEmbeddingJson(writeEmbedding(embedding));
            doctorEmbeddingCacheRepository.save(cache);
            return embedding;
        }

        List<Double> embedding = embeddingService.generateEmbedding(sourceText);
        doctorEmbeddingCacheRepository.save(DoctorEmbeddingCache.builder()
                .doctorId(doctorId)
                .sourceText(sourceText)
                .embeddingJson(writeEmbedding(embedding))
                .build());
        return embedding;
    }

    private List<Double> parseEmbedding(String embeddingJson) {
        try {
            return objectMapper.readValue(embeddingJson, new TypeReference<>() {
            });
        } catch (JsonProcessingException ex) {
            throw new EmbeddingServiceException("Failed to parse cached embedding", ex);
        }
    }

    private String writeEmbedding(List<Double> embedding) {
        try {
            return objectMapper.writeValueAsString(embedding);
        } catch (JsonProcessingException ex) {
            throw new EmbeddingServiceException("Failed to cache embedding", ex);
        }
    }

    private String buildDoctorSourceText(DoctorServiceDoctorDto doctor) {
        String specialization = valueOrDefault(doctor.getSpecialization(), "General Medicine");
        String bio = valueOrDefault(doctor.getBio(), "Treats common medical conditions");
        String qualifications = valueOrDefault(doctor.getQualifications(), "No qualifications provided");
        int years = doctor.getExperienceYears() == null ? 0 : doctor.getExperienceYears();

        return "%s specialist. %s Qualifications: %s. %d years experience."
                .formatted(specialization, bio, qualifications, years);
    }

    private String deriveRecommendedSpecialty(List<RankedDoctorResult> topResults) {
        String topSpecialty = topResults.get(0).getDoctor().getSpecialization();
        if (StringUtils.hasText(topSpecialty)) {
            return topSpecialty;
        }

        Map<String, Long> frequencyMap = topResults.stream()
                .map(result -> valueOrDefault(result.getDoctor().getSpecialization(), "General Medicine"))
                .collect(Collectors.groupingBy(value -> value, Collectors.counting()));

        return frequencyMap.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("General Medicine");
    }

    private String buildResponseExplanation(String recommendedSpecialty, List<RankedDoctorResult> topResults) {
        RankedDoctorResult bestMatch = topResults.get(0);
        String name = buildDoctorName(bestMatch.getDoctor());
        return "Top recommendation is %s because the symptom query semantically matches %s and produced the highest final score."
                .formatted(recommendedSpecialty, name);
    }

    private DoctorSuggestionDto toDoctorSuggestionDto(RankedDoctorResult result) {
        DoctorServiceDoctorDto doctor = result.getDoctor();
        return DoctorSuggestionDto.builder()
                .doctorId(doctor.getId())
                .doctorName(buildDoctorName(doctor))
                .specialization(valueOrDefault(doctor.getSpecialization(), "General Medicine"))
                .experienceYears(doctor.getExperienceYears() == null ? 0 : doctor.getExperienceYears())
                .verificationStatus(valueOrDefault(doctor.getVerificationStatus(), "UNKNOWN"))
                .nextAvailableSlot(valueOrDefault(doctor.getNextAvailableSlot(), "Not available"))
                .semanticScore(result.getSemanticScore())
                .finalScore(result.getFinalScore())
                .build();
    }

    private String buildDoctorName(DoctorServiceDoctorDto doctor) {
        String firstName = valueOrDefault(doctor.getFirstName(), "Doctor");
        String lastName = valueOrDefault(doctor.getLastName(), "");
        return (firstName + " " + lastName).trim();
    }

    private String valueOrDefault(String value, String defaultValue) {
        return StringUtils.hasText(value) ? value : defaultValue;
    }

    private double round(double value) {
        return Math.round(value * 10000.0) / 10000.0;
    }
}
