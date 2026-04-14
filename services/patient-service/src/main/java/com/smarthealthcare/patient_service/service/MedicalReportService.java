package com.smarthealthcare.patient_service.service;

import com.smarthealthcare.patient_service.dto.MedicalReportResponse;
import com.smarthealthcare.patient_service.dto.AppointmentAccessResponse;
import com.smarthealthcare.patient_service.entity.MedicalReport;
import com.smarthealthcare.patient_service.entity.PatientProfile;
import com.smarthealthcare.patient_service.entity.ReportType;
import com.smarthealthcare.patient_service.exception.ResourceNotFoundException;
import com.smarthealthcare.patient_service.repository.MedicalReportRepository;
import com.smarthealthcare.patient_service.repository.PatientProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MedicalReportService {

    private static final Logger logger = LoggerFactory.getLogger(MedicalReportService.class);
    private static final String DOCTOR_ROLE = "DOCTOR";

    private final MedicalReportRepository medicalReportRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final Path fileStorageLocation;
    private final RestClient appointmentServiceClient;

    public MedicalReportService(MedicalReportRepository medicalReportRepository,
                                PatientProfileRepository patientProfileRepository,
                                @Value("${app.upload.dir:uploads}") String uploadDir,
                                @Value("${app.services.appointment.base-url:http://localhost:8082}") String appointmentServiceBaseUrl) {
        this.medicalReportRepository = medicalReportRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.appointmentServiceClient = RestClient.builder()
                .baseUrl(appointmentServiceBaseUrl)
                .build();

        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    private PatientProfile getOrCreateProfile(Long authUserId) {
        return patientProfileRepository.findByAuthUserId(authUserId)
                .orElseGet(() -> {
                    PatientProfile newProfile = new PatientProfile();
                    newProfile.setAuthUserId(authUserId);
                    return patientProfileRepository.save(newProfile);
                });
    }

    @Transactional
    public MedicalReportResponse uploadReport(Long authUserId, MultipartFile file, String title,
                                              String description, ReportType reportType, LocalDate reportDate) {
        PatientProfile profile = getOrCreateProfile(authUserId);

        String originalFileName = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFileName != null && originalFileName.lastIndexOf(".") > -1) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        
        String storedFileName = UUID.randomUUID().toString() + fileExtension;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            MedicalReport report = new MedicalReport();
            report.setPatientProfile(profile);
            report.setTitle(title);
            report.setDescription(description);
            report.setReportType(reportType);
            report.setReportDate(reportDate);
            report.setFileName(storedFileName);
            report.setOriginalFileName(originalFileName);
            report.setFilePath(targetLocation.toString());
            report.setFileSize(file.getSize());
            report.setContentType(file.getContentType());
            
            return MedicalReportResponse.fromEntity(medicalReportRepository.save(report));

        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + originalFileName + ". Please try again!", ex);
        }
    }

    public List<MedicalReportResponse> getReports(Long authUserId, ReportType type) {
        PatientProfile profile = getOrCreateProfile(authUserId);

        List<MedicalReport> reports;
        if (type != null) {
            reports = medicalReportRepository.findAllByPatientProfile_IdAndReportTypeOrderByUploadedAtDesc(profile.getId(), type);
        } else {
            reports = medicalReportRepository.findAllByPatientProfile_IdOrderByUploadedAtDesc(profile.getId());
        }

        return reports.stream().map(MedicalReportResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MedicalReportResponse> getReportsForDoctor(
            Long doctorId,
            String doctorRole,
            Long patientAuthUserId,
            ReportType type) {
        validateDoctorAccess(doctorId, doctorRole, patientAuthUserId);

        PatientProfile patientProfile = getRequiredProfile(patientAuthUserId);
        List<MedicalReport> reports = type == null
                ? medicalReportRepository.findAllByPatientProfile_IdOrderByUploadedAtDesc(patientProfile.getId())
                : medicalReportRepository.findAllByPatientProfile_IdAndReportTypeOrderByUploadedAtDesc(
                        patientProfile.getId(),
                        type);

        logger.info(
                "Doctor {} listed {} reports for patient {}",
                doctorId,
                reports.size(),
                patientAuthUserId);

        return reports.stream().map(MedicalReportResponse::fromEntity).collect(Collectors.toList());
    }

    public Resource downloadReportAsResource(Long authUserId, Long reportId) {
        PatientProfile profile = getOrCreateProfile(authUserId);

        MedicalReport report = medicalReportRepository.findByIdAndPatientProfile_Id(reportId, profile.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Report not found or not owned by patient"));

        try {
            Path filePath = this.fileStorageLocation.resolve(report.getFileName()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File not found on server " + report.getFileName());
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("File not found " + report.getFileName(), ex);
        }
    }

    @Transactional(readOnly = true)
    public Resource downloadReportAsResourceForDoctor(
            Long doctorId,
            String doctorRole,
            Long patientAuthUserId,
            Long reportId) {
        MedicalReport report = getReportRawForDoctor(doctorId, doctorRole, patientAuthUserId, reportId);

        try {
            Path filePath = this.fileStorageLocation.resolve(report.getFileName()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                logger.info(
                        "Doctor {} downloaded report {} for patient {}",
                        doctorId,
                        reportId,
                        patientAuthUserId);
                return resource;
            }

            throw new ResourceNotFoundException("File not found on server " + report.getFileName());
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("File not found " + report.getFileName(), ex);
        }
    }
    
    public MedicalReport getReportRaw(Long authUserId, Long reportId) {
        PatientProfile profile = getOrCreateProfile(authUserId);
        return medicalReportRepository.findByIdAndPatientProfile_Id(reportId, profile.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Report not found or not owned by patient"));
    }

    @Transactional(readOnly = true)
    public MedicalReport getReportRawForDoctor(
            Long doctorId,
            String doctorRole,
            Long patientAuthUserId,
            Long reportId) {
        validateDoctorAccess(doctorId, doctorRole, patientAuthUserId);

        PatientProfile patientProfile = getRequiredProfile(patientAuthUserId);
        return medicalReportRepository.findByIdAndPatientProfile_Id(reportId, patientProfile.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Report not found for the requested patient"));
    }

    @Transactional
    public void deleteReport(Long authUserId, Long reportId) {
        PatientProfile profile = getOrCreateProfile(authUserId);

        MedicalReport report = medicalReportRepository.findByIdAndPatientProfile_Id(reportId, profile.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Report not found or not owned by patient"));

        try {
            Path filePath = this.fileStorageLocation.resolve(report.getFileName()).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            // Log but don't fail the DB deletion if file is already missing
            ex.printStackTrace();
        }

        medicalReportRepository.delete(report);
    }

    private PatientProfile getRequiredProfile(Long authUserId) {
        return patientProfileRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
    }

    private void validateDoctorAccess(Long doctorId, String doctorRole, Long patientAuthUserId) {
        if (doctorId == null) {
            throw new AccessDeniedException("Doctor id is required");
        }

        if (doctorRole == null || !DOCTOR_ROLE.equalsIgnoreCase(doctorRole)) {
            throw new AccessDeniedException("Only doctors can access patient reports");
        }

        if (!hasCompletedAppointmentLink(doctorId, patientAuthUserId)) {
            throw new AccessDeniedException("Doctor is not authorized to access this patient's reports");
        }
    }

    private boolean hasCompletedAppointmentLink(Long doctorId, Long patientAuthUserId) {
        try {
            AppointmentAccessResponse response = appointmentServiceClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/appointments/internal/access-check")
                            .queryParam("doctorId", doctorId)
                            .queryParam("patientId", patientAuthUserId)
                            .build())
                    .retrieve()
                    .body(AppointmentAccessResponse.class);

            return response != null && response.isHasAccess();
        } catch (RestClientException ex) {
            logger.error("Failed to validate doctor-patient appointment access", ex);
            throw new IllegalStateException("Unable to validate appointment access at this time");
        }
    }
}
