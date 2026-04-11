package com.smarthealthcare.ai_doctor_suggestion.service;

import com.smarthealthcare.ai_doctor_suggestion.dto.DoctorServiceDoctorDto;
import org.springframework.stereotype.Service;

@Service
public class RankingService {

    public double calculateFinalScore(double semanticSimilarity, DoctorServiceDoctorDto doctor) {
        double availabilityScore = Boolean.TRUE.equals(doctor.getAvailable()) ? 1.0 : 0.0;
        double verificationScore = "APPROVED".equalsIgnoreCase(doctor.getVerificationStatus()) ? 1.0 : 0.0;
        double experienceYears = doctor.getExperienceYears() == null ? 0.0 : doctor.getExperienceYears();
        double experienceScore = Math.min(experienceYears / 20.0, 1.0);

        return (semanticSimilarity * 0.60)
                + (availabilityScore * 0.20)
                + (verificationScore * 0.10)
                + (experienceScore * 0.10);
    }
}
