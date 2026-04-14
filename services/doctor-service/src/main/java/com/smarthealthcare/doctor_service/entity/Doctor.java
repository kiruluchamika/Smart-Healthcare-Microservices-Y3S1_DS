package com.smarthealthcare.doctor_service.entity;

import com.smarthealthcare.doctor_service.enums.OnboardingState;
import com.smarthealthcare.doctor_service.enums.VerificationStatus;
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
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "doctors", uniqueConstraints = {
        @UniqueConstraint(name = "uk_doctor_email", columnNames = "email"),
        @UniqueConstraint(name = "uk_doctor_license", columnNames = "license_number")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String firstName;

    @Column(nullable = false, length = 80)
    private String lastName;

    @Column(nullable = false, length = 120)
    private String email;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, length = 120)
    private String specialization;

    @Column(nullable = false, length = 300)
    private String qualifications;

    @Column(nullable = false)
    private Integer experienceYears;

    @Column(nullable = false, name = "license_number", length = 100)
    private String licenseNumber;

    @Column(length = 2500)
    private String bio;

    @Column(name = "board_certifications", length = 500)
    private String boardCertifications;

    @Column(name = "languages_spoken", length = 300)
    private String languagesSpoken;

    @Column(name = "clinic_locations", length = 500)
    private String clinicLocations;

    @Column(name = "insurance_providers", length = 500)
    private String insuranceProviders;

    @Column(name = "license_expiry_date")
    private LocalDate licenseExpiryDate;

    @Column(name = "consultation_fee", precision = 19, scale = 2)
    private BigDecimal consultationFee;

    @Column(name = "profile_picture_url", columnDefinition = "LONGTEXT")
    private String profilePictureUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private VerificationStatus verificationStatus;

    @Column(nullable = false)
    private Boolean active;

    @Column(nullable = false)
    private Integer profileCompletenessScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OnboardingState onboardingState;

    @Version
    private Long version;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.verificationStatus == null) {
            this.verificationStatus = VerificationStatus.PENDING;
        }
        syncActivationFromVerification();
        if (this.profileCompletenessScore == null) {
            this.profileCompletenessScore = 0;
        }
        if (this.onboardingState == null) {
            this.onboardingState = OnboardingState.DRAFT;
        }
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = LocalDateTime.now();
        syncActivationFromVerification();
    }

    private void syncActivationFromVerification() {
        this.active = this.verificationStatus == VerificationStatus.APPROVED;
    }
}
