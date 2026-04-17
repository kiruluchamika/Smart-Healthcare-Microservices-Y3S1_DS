package com.smarthealthcare.doctor_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Prescription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String rxNumber;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private Long doctorId;

    @Column(nullable = false)
    private Long appointmentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    private String diagnosis;
    private String notes;
    private LocalDateTime issuedAt;
    private LocalDateTime expiresAt;
    private String signatureHash;
    private String signedBy;
    private LocalDateTime signedAt;
    private Integer version;

    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PrescriptionItem> items;

    public void setItems(List<PrescriptionItem> items) {
        this.items = items == null ? new ArrayList<>() : items;
        this.items.forEach(item -> item.setPrescription(this));
    }

    public void addItem(PrescriptionItem item) {
        if (item == null) {
            return;
        }
        if (this.items == null) {
            this.items = new ArrayList<>();
        }
        item.setPrescription(this);
        this.items.add(item);
    }

    public enum Status {
        DRAFT, SIGNED, SENT_TO_PATIENT, CANCELLED, EXPIRED
    }
}
