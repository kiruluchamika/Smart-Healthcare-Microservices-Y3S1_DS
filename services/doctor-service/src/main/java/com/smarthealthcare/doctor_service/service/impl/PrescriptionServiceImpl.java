package com.smarthealthcare.doctor_service.service.impl;

import com.smarthealthcare.doctor_service.entity.Prescription;
import com.smarthealthcare.doctor_service.entity.PrescriptionItem;
import com.smarthealthcare.doctor_service.exception.BadRequestException;
import com.smarthealthcare.doctor_service.exception.ResourceNotFoundException;
import com.smarthealthcare.doctor_service.repository.PrescriptionRepository;
import com.smarthealthcare.doctor_service.service.PrescriptionService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import com.smarthealthcare.doctor_service.client.AppointmentServiceClient;
import com.smarthealthcare.doctor_service.dto.integration.AppointmentLookupResponse;

@Service
@RequiredArgsConstructor
public class PrescriptionServiceImpl implements PrescriptionService {
    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentServiceClient appointmentServiceClient;

    @Override
    @Transactional
    public Prescription createDraft(Prescription prescription) {
        validateDoctorAppointmentAccess(
                prescription.getAppointmentId(),
                prescription.getPatientId(),
                prescription.getDoctorId());

        prescriptionRepository.findByAppointmentId(prescription.getAppointmentId())
                .ifPresent(existing -> {
                    throw new BadRequestException("Prescription already exists for this appointment");
                });

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
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found"));
        if (!prescription.getDoctorId().equals(doctorId)) {
            throw new BadRequestException("Unauthorized");
        }
        if (prescription.getStatus() != Prescription.Status.DRAFT) {
            throw new BadRequestException("Prescription already signed or invalid state");
        }

        validateDoctorAppointmentAccess(
                prescription.getAppointmentId(),
                prescription.getPatientId(),
                doctorId);

        prescription.setStatus(Prescription.Status.SIGNED);
        prescription.setSignedBy("doctor:" + doctorId);
        prescription.setSignedAt(LocalDateTime.now());
        prescription.setSignatureHash(UUID.randomUUID().toString()); // Simulate digital signature
        return prescriptionRepository.save(prescription);
    }

    @Override
    public Prescription getPrescription(Long prescriptionId, Long requesterId, String role) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found"));
        validatePrescriptionAccess(prescription, requesterId, role);
        return prescription;
    }

    @Override
    public Prescription getPrescriptionByAppointment(Long appointmentId, Long requesterId, String role) {
        Prescription prescription = prescriptionRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found for appointment"));
        validatePrescriptionAccess(prescription, requesterId, role);
        return prescription;
    }

    @Override
    public List<Prescription> getPrescriptionsByPatient(Long patientId, Long requesterId, String role) {
        if ("PATIENT".equalsIgnoreCase(role) && !patientId.equals(requesterId)) {
            throw new BadRequestException("Unauthorized");
        }
        return prescriptionRepository.findByPatientId(patientId);
    }

    @Override
    public void validateDoctorAppointmentAccess(Long appointmentId, Long patientId, Long doctorId) {
        if (appointmentId == null || patientId == null || doctorId == null) {
            throw new BadRequestException("Appointment, patient, and doctor are required");
        }

        AppointmentLookupResponse appointment = appointmentServiceClient.getAppointmentById(appointmentId);
        if (!patientId.equals(appointment.getPatientId()) || !doctorId.equals(appointment.getDoctorId())) {
            throw new BadRequestException("Appointment does not belong to this doctor and patient");
        }
        if (!"COMPLETED".equalsIgnoreCase(appointment.getStatus())) {
            throw new BadRequestException("Prescription can only be issued after telemedicine/consultation is COMPLETED");
        }
    }

    private void validatePrescriptionAccess(Prescription prescription, Long requesterId, String role) {
        if ("DOCTOR".equalsIgnoreCase(role) && !prescription.getDoctorId().equals(requesterId)) {
            throw new BadRequestException("Unauthorized");
        }
        if ("PATIENT".equalsIgnoreCase(role) && !prescription.getPatientId().equals(requesterId)) {
            throw new BadRequestException("Unauthorized");
        }
    }
}
