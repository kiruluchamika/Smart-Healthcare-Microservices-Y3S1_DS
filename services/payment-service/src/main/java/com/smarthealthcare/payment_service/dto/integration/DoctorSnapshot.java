package com.smarthealthcare.payment_service.dto.integration;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public record DoctorSnapshot(
        Long id,
        String firstName,
        String lastName,
        BigDecimal consultationFee,
        String verificationStatus,
        Boolean active) {
}
