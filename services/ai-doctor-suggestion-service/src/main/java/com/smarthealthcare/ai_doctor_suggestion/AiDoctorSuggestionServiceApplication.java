package com.smarthealthcare.ai_doctor_suggestion;

import com.smarthealthcare.ai_doctor_suggestion.config.DoctorServiceProperties;
import com.smarthealthcare.ai_doctor_suggestion.config.OllamaProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({ DoctorServiceProperties.class, OllamaProperties.class })
public class AiDoctorSuggestionServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiDoctorSuggestionServiceApplication.class, args);
    }
}
