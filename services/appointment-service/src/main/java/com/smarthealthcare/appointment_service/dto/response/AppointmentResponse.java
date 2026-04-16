package com.smarthealthcare.appointment_service.dto.response;

import com.smarthealthcare.appointment_service.entity.Appointment;
import com.smarthealthcare.appointment_service.enums.AppointmentStatus;
import com.smarthealthcare.appointment_service.enums.AppointmentType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class AppointmentResponse {

    private Long id;
    private Long patientId;
    private Long doctorId;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private AppointmentType appointmentType;
    private AppointmentStatus status;
    private String reasonForVisit;
    private BigDecimal fixedFeeSnapshot;
    private BigDecimal doctorExtraFee;
    private BigDecimal finalFee;
    private String feeCurrency;
    private LocalDateTime feeLockedAt;
    private String extraFeeReason;
    private String statusReason;
    private String paymentStatusHint;
    private LocalDateTime paymentPaidAt;
    private String telemedicineSessionUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AppointmentResponse fromEntity(Appointment appointment) {
        AppointmentResponse response = new AppointmentResponse();
        response.setId(appointment.getId());
        response.setPatientId(appointment.getPatientId());
        response.setDoctorId(appointment.getDoctorId());
        response.setAppointmentDate(appointment.getAppointmentDate());
        response.setStartTime(appointment.getStartTime());
        response.setEndTime(appointment.getEndTime());
        response.setAppointmentType(appointment.getAppointmentType());
        response.setStatus(appointment.getStatus());
        response.setReasonForVisit(appointment.getReasonForVisit());
        response.setFixedFeeSnapshot(appointment.getFixedFeeSnapshot());
        response.setDoctorExtraFee(appointment.getDoctorExtraFee());
        response.setFinalFee(appointment.getFinalFee());
        response.setFeeCurrency(appointment.getFeeCurrency());
        response.setFeeLockedAt(appointment.getFeeLockedAt());
        response.setExtraFeeReason(appointment.getExtraFeeReason());
        response.setStatusReason(appointment.getStatusReason());
        response.setPaymentStatusHint(appointment.getPaymentStatusHint());
        response.setPaymentPaidAt(appointment.getPaymentPaidAt());
        response.setTelemedicineSessionUrl(appointment.getTelemedicineSessionUrl());
        response.setCreatedAt(appointment.getCreatedAt());
        response.setUpdatedAt(appointment.getUpdatedAt());
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public LocalDate getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(LocalDate appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public AppointmentType getAppointmentType() {
        return appointmentType;
    }

    public void setAppointmentType(AppointmentType appointmentType) {
        this.appointmentType = appointmentType;
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    public void setStatus(AppointmentStatus status) {
        this.status = status;
    }

    public String getReasonForVisit() {
        return reasonForVisit;
    }

    public void setReasonForVisit(String reasonForVisit) {
        this.reasonForVisit = reasonForVisit;
    }

    public BigDecimal getFixedFeeSnapshot() {
        return fixedFeeSnapshot;
    }

    public void setFixedFeeSnapshot(BigDecimal fixedFeeSnapshot) {
        this.fixedFeeSnapshot = fixedFeeSnapshot;
    }

    public BigDecimal getDoctorExtraFee() {
        return doctorExtraFee;
    }

    public void setDoctorExtraFee(BigDecimal doctorExtraFee) {
        this.doctorExtraFee = doctorExtraFee;
    }

    public BigDecimal getFinalFee() {
        return finalFee;
    }

    public void setFinalFee(BigDecimal finalFee) {
        this.finalFee = finalFee;
    }

    public String getFeeCurrency() {
        return feeCurrency;
    }

    public void setFeeCurrency(String feeCurrency) {
        this.feeCurrency = feeCurrency;
    }

    public LocalDateTime getFeeLockedAt() {
        return feeLockedAt;
    }

    public void setFeeLockedAt(LocalDateTime feeLockedAt) {
        this.feeLockedAt = feeLockedAt;
    }

    public String getExtraFeeReason() {
        return extraFeeReason;
    }

    public void setExtraFeeReason(String extraFeeReason) {
        this.extraFeeReason = extraFeeReason;
    }

    public String getStatusReason() {
        return statusReason;
    }

    public void setStatusReason(String statusReason) {
        this.statusReason = statusReason;
    }

    public String getPaymentStatusHint() {
        return paymentStatusHint;
    }

    public void setPaymentStatusHint(String paymentStatusHint) {
        this.paymentStatusHint = paymentStatusHint;
    }

    public LocalDateTime getPaymentPaidAt() {
        return paymentPaidAt;
    }

    public void setPaymentPaidAt(LocalDateTime paymentPaidAt) {
        this.paymentPaidAt = paymentPaidAt;
    }

    public String getTelemedicineSessionUrl() {
        return telemedicineSessionUrl;
    }

    public void setTelemedicineSessionUrl(String telemedicineSessionUrl) {
        this.telemedicineSessionUrl = telemedicineSessionUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
