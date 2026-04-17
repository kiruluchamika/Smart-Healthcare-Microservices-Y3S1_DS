package com.smarthealthcare.doctor_service.service.impl;

import com.smarthealthcare.doctor_service.client.AppointmentServiceClient;
import com.smarthealthcare.doctor_service.dto.integration.AppointmentLookupResponse;
import com.smarthealthcare.doctor_service.entity.Prescription;
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

@Service
@RequiredArgsConstructor
public class PrescriptionServiceImpl implements PrescriptionService {
    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentServiceClient appointmentServiceClient;

    @Override
    @Transactional
    public Prescription createDraft(Prescription prescription) {
        prescription.setStatus(Prescription.Status.DRAFT);
        prescription.setIssuedAt(LocalDateTime.now());
        prescription.setRxNumber(UUID.randomUUID().toString());
        prescription.setVersion(1);
        if (prescription.getItems() == null) {
            prescription.setItems(new ArrayList<>());
        }
        return prescriptionRepository.save(prescription);
    }

    @Override
    public void validateDoctorAppointmentAccess(Long appointmentId, Long patientId, Long doctorId) {
        AppointmentLookupResponse appointment = appointmentServiceClient.getAppointmentById(appointmentId);
        if (!doctorId.equals(appointment.getDoctorId())) {
            throw new BadRequestException("You can only create prescriptions for your own appointments");
        }
        if (!patientId.equals(appointment.getPatientId())) {
            throw new BadRequestException("Prescription patient does not match the appointment");
        }
    }

    @Override
    @Transactional
    public Prescription signPrescription(Long prescriptionId, Long doctorId) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));
        validateDoctorAppointmentAccess(prescription.getAppointmentId(), prescription.getPatientId(), doctorId);
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
        authorizePrescriptionAccess(prescription, requesterId, role);
        return prescription;
    }

    @Override
    public Prescription getPrescriptionByAppointment(Long appointmentId, Long requesterId, String role) {
        Prescription prescription = prescriptionRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found"));
        authorizePrescriptionAccess(prescription, requesterId, role);
        return prescription;
    }

    private void authorizePrescriptionAccess(Prescription prescription, Long requesterId, String role) {
        if (role.equals("DOCTOR") && !prescription.getDoctorId().equals(requesterId)) {
            throw new RuntimeException("Unauthorized");
        }
        if (role.equals("PATIENT") && !prescription.getPatientId().equals(requesterId)) {
            throw new RuntimeException("Unauthorized");
        }
    }

    @Override
    public List<Prescription> getPrescriptionsByPatient(Long patientId, Long requesterId, String role) {
        if (role.equals("PATIENT") && !patientId.equals(requesterId)) {
            throw new RuntimeException("Unauthorized");
        }
        return prescriptionRepository.findByPatientId(patientId);
    }
}
