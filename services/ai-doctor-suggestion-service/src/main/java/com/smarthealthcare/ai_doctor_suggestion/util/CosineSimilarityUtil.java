package com.smarthealthcare.ai_doctor_suggestion.util;

import java.util.List;

public final class CosineSimilarityUtil {

    private CosineSimilarityUtil() {
    }

    public static double cosineSimilarity(List<Double> firstVector, List<Double> secondVector) {
        if (firstVector == null || secondVector == null || firstVector.isEmpty() || secondVector.isEmpty()) {
            return 0.0;
        }
        if (firstVector.size() != secondVector.size()) {
            return 0.0;
        }

        double dotProduct = 0.0;
        double firstMagnitude = 0.0;
        double secondMagnitude = 0.0;

        for (int i = 0; i < firstVector.size(); i++) {
            double first = firstVector.get(i);
            double second = secondVector.get(i);
            dotProduct += first * second;
            firstMagnitude += first * first;
            secondMagnitude += second * second;
        }

        if (firstMagnitude == 0.0 || secondMagnitude == 0.0) {
            return 0.0;
        }

        return dotProduct / (Math.sqrt(firstMagnitude) * Math.sqrt(secondMagnitude));
    }
}
