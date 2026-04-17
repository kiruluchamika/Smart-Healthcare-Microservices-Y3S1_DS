package com.smarthealthcare.doctor_service.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @Column(nullable = false)
    private String medicineName;
    private String medicineCode;
    private String strength;
    private String form;
    private String doseAmount;
    private String doseUnit;
    private String frequencyText;
    private String route;
    private Integer durationDays;
    private Integer quantity;
    private Boolean substitutionAllowed;
}
