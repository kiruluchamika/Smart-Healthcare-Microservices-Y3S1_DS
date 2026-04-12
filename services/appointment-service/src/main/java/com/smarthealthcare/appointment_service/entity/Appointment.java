package com.smarthealthcare.appointment_service.entity;

import com.smarthealthcare.appointment_service.enums.AppointmentStatus;
import com.smarthealthcare.appointment_service.enums.AppointmentType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private Long doctorId;

    @Column(nullable = false)
    private LocalDate appointmentDate;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AppointmentType appointmentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AppointmentStatus status;

    @Column(nullable = false, length = 1000)
    private String reasonForVisit;

    @Column(precision = 19, scale = 2)
    private BigDecimal fixedFeeSnapshot;

    @Column(precision = 19, scale = 2)
    private BigDecimal doctorExtraFee;

    @Column(precision = 19, scale = 2)
    private BigDecimal finalFee;

    @Column(length = 8)
    private String feeCurrency;

    private LocalDateTime feeLockedAt;

    @Column(length = 500)
    private String extraFeeReason;

    @Column(length = 32)
    private String paymentStatusHint;

    private LocalDateTime paymentPaidAt;

    @Column(length = 1024)
    private String telemedicineSessionUrl;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = AppointmentStatus.PENDING;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
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
