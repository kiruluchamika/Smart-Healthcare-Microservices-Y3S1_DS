package com.smarthealthcare.doctor_service.service;

import com.smarthealthcare.doctor_service.entity.Prescription;
import java.util.List;

public interface PrescriptionService {
    Prescription createDraft(Prescription prescription);
    Prescription signPrescription(Long prescriptionId, Long doctorId);
    Prescription getPrescription(Long prescriptionId, Long requesterId, String role);
    Prescription getPrescriptionByAppointment(Long appointmentId, Long requesterId, String role);
    List<Prescription> getPrescriptionsByPatient(Long patientId, Long requesterId, String role);
    void validateDoctorAppointmentAccess(Long appointmentId, Long patientId, Long doctorId);
}
