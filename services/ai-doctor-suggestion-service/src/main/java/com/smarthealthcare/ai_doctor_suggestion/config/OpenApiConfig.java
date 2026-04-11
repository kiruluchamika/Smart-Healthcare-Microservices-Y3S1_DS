package com.smarthealthcare.ai_doctor_suggestion.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI aiDoctorSuggestionOpenApi() {
        return new OpenAPI().info(
                new Info()
                        .title("AI Doctor Suggestion Service API")
                        .version("v1")
                        .description("Suggests doctors using Ollama embeddings and cosine similarity")
                        .contact(new Contact().name("Smart Healthcare Team")));
    }
}
