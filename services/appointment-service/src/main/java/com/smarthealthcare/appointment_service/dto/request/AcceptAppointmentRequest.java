package com.smarthealthcare.appointment_service.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class AcceptAppointmentRequest {

    @DecimalMin(value = "0.00", message = "Extra fee cannot be negative")
    private BigDecimal extraFee;

    @Size(max = 500, message = "Extra fee reason must not exceed 500 characters")
    private String extraFeeReason;

    public BigDecimal getExtraFee() {
        return extraFee;
    }

    public void setExtraFee(BigDecimal extraFee) {
        this.extraFee = extraFee;
    }

    public String getExtraFeeReason() {
        return extraFeeReason;
    }

    public void setExtraFeeReason(String extraFeeReason) {
        this.extraFeeReason = extraFeeReason;
    }
}
