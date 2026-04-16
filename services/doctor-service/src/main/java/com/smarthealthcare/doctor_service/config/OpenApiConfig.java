package com.smarthealthcare.doctor_service.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

        @Bean
        public OpenAPI doctorServiceOpenApi() {
                String schemeName = "basicAuth";
                return new OpenAPI()
                                .info(new Info()
                                                .title("Doctor Service API")
                                                .description("Doctor management APIs for profile, verification, availability, and dashboard")
                                                .version("v1")
                                                .contact(new Contact().name("Smart Healthcare Team")))
                                .components(new Components()
                                                .addSecuritySchemes(schemeName,
                                                                new SecurityScheme()
                                                                                .type(SecurityScheme.Type.HTTP)
                                                                                .scheme("basic")))
                                .addSecurityItem(new SecurityRequirement().addList(schemeName));
        }
}
