package com.smarthealthcare.patient_service.service;

import com.smarthealthcare.patient_service.dto.MedicalHistoryRequest;
import com.smarthealthcare.patient_service.dto.MedicalHistoryResponse;
import com.smarthealthcare.patient_service.entity.MedicalHistory;
import com.smarthealthcare.patient_service.entity.PatientProfile;
import com.smarthealthcare.patient_service.exception.ResourceNotFoundException;
import com.smarthealthcare.patient_service.repository.MedicalHistoryRepository;
import com.smarthealthcare.patient_service.repository.PatientProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MedicalHistoryService {

    private final MedicalHistoryRepository medicalHistoryRepository;
    private final PatientProfileRepository patientProfileRepository;

    public MedicalHistoryService(MedicalHistoryRepository medicalHistoryRepository,
                                 PatientProfileRepository patientProfileRepository) {
        this.medicalHistoryRepository = medicalHistoryRepository;
        this.patientProfileRepository = patientProfileRepository;
    }

        private PatientProfile getOrCreateProfile(Long authUserId) {
                return patientProfileRepository.findByAuthUserId(authUserId)
                                .orElseGet(() -> {
                                        PatientProfile newProfile = new PatientProfile();
                                        newProfile.setAuthUserId(authUserId);
                                        return patientProfileRepository.save(newProfile);
                                });
        }

    public List<MedicalHistoryResponse> getHistory(Long authUserId) {
                PatientProfile profile = getOrCreateProfile(authUserId);

        return medicalHistoryRepository.findAllByPatientProfile_IdOrderByEventDateDesc(profile.getId())
                .stream()
                .map(MedicalHistoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public MedicalHistoryResponse addEntry(Long authUserId, MedicalHistoryRequest request) {
                PatientProfile profile = getOrCreateProfile(authUserId);

        MedicalHistory history = new MedicalHistory();
        history.setPatientProfile(profile);
        history.setEventType(request.getEventType());
        history.setTitle(request.getTitle());
        history.setDescription(request.getDescription());
        history.setEventDate(request.getEventDate());
        history.setDoctorName(request.getDoctorName());
        history.setFacilityName(request.getFacilityName());
        history.setNotes(request.getNotes());

        return MedicalHistoryResponse.fromEntity(medicalHistoryRepository.save(history));
    }

    @Transactional
    public MedicalHistoryResponse updateEntry(Long authUserId, Long historyId, MedicalHistoryRequest request) {
                PatientProfile profile = getOrCreateProfile(authUserId);

        MedicalHistory history = medicalHistoryRepository.findByIdAndPatientProfile_Id(historyId, profile.getId())
                .orElseThrow(() -> new ResourceNotFoundException("History entry not found or not owned by patient"));

        history.setEventType(request.getEventType());
        history.setTitle(request.getTitle());
        history.setDescription(request.getDescription());
        history.setEventDate(request.getEventDate());
        history.setDoctorName(request.getDoctorName());
        history.setFacilityName(request.getFacilityName());
        history.setNotes(request.getNotes());

        return MedicalHistoryResponse.fromEntity(medicalHistoryRepository.save(history));
    }

    @Transactional
    public void deleteEntry(Long authUserId, Long historyId) {
                PatientProfile profile = getOrCreateProfile(authUserId);

        MedicalHistory history = medicalHistoryRepository.findByIdAndPatientProfile_Id(historyId, profile.getId())
                .orElseThrow(() -> new ResourceNotFoundException("History entry not found or not owned by patient"));

        medicalHistoryRepository.delete(history);
    }
}
