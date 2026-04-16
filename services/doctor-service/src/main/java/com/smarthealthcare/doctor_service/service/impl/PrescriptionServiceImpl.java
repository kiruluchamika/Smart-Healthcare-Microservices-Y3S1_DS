package com.smarthealthcare.doctor_service.service.impl;

import com.smarthealthcare.doctor_service.entity.Prescription;
import com.smarthealthcare.doctor_service.entity.PrescriptionItem;
import com.smarthealthcare.doctor_service.repository.PrescriptionRepository;
import com.smarthealthcare.doctor_service.service.PrescriptionService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PrescriptionServiceImpl implements PrescriptionService {
    private final PrescriptionRepository prescriptionRepository;

    @Override
    @Transactional
    public Prescription createDraft(Prescription prescription) {
        prescription.setStatus(Prescription.Status.DRAFT);
        prescription.setIssuedAt(LocalDateTime.now());
        prescription.setRxNumber(UUID.randomUUID().toString());
        prescription.setVersion(1);

        List<PrescriptionItem> requestedItems = prescription.getItems() == null
                ? new ArrayList<>()
                : new ArrayList<>(prescription.getItems());

        prescription.setItems(new ArrayList<>());
        Prescription savedPrescription = prescriptionRepository.save(prescription);

        if (!requestedItems.isEmpty()) {
            savedPrescription.setItems(requestedItems);
            savedPrescription = prescriptionRepository.save(savedPrescription);
        }

        return savedPrescription;
    }

    @Override
    @Transactional
    public Prescription signPrescription(Long prescriptionId, Long doctorId) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));
        if (!prescription.getDoctorId().equals(doctorId)) {
            throw new RuntimeException("Unauthorized");
        }
        if (prescription.getStatus() != Prescription.Status.DRAFT) {
            throw new RuntimeException("Prescription already signed or invalid state");
        }
        prescription.setStatus(Prescription.Status.SIGNED);
        prescription.setSignedBy("doctor:" + doctorId);
        prescription.setSignedAt(LocalDateTime.now());
        prescription.setSignatureHash(UUID.randomUUID().toString()); // Simulate digital signature
        return prescriptionRepository.save(prescription);
    }

    @Override
    public Prescription getPrescription(Long prescriptionId, Long requesterId, String role) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));
        if (role.equals("DOCTOR") && !prescription.getDoctorId().equals(requesterId)) {
            throw new RuntimeException("Unauthorized");
        }
        if (role.equals("PATIENT") && !prescription.getPatientId().equals(requesterId)) {
            throw new RuntimeException("Unauthorized");
        }
        return prescription;
    }

    @Override
    public List<Prescription> getPrescriptionsByPatient(Long patientId, Long requesterId, String role) {
        if (role.equals("PATIENT") && !patientId.equals(requesterId)) {
            throw new RuntimeException("Unauthorized");
        }
        return prescriptionRepository.findByPatientId(patientId);
    }
}
