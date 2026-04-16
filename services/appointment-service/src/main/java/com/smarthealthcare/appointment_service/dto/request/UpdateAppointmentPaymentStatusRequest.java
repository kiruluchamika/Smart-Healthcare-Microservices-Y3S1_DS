package com.smarthealthcare.appointment_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public class UpdateAppointmentPaymentStatusRequest {

    @NotBlank(message = "Payment status is required")
    @Size(max = 32, message = "Payment status must not exceed 32 characters")
    private String paymentStatus;

    private LocalDateTime paidAt;

    @Size(max = 1024, message = "Telemedicine session URL must not exceed 1024 characters")
    private String telemedicineSessionUrl;

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }

    public String getTelemedicineSessionUrl() {
        return telemedicineSessionUrl;
    }

    public void setTelemedicineSessionUrl(String telemedicineSessionUrl) {
        this.telemedicineSessionUrl = telemedicineSessionUrl;
    }
}
