package com.smarthealthcare.patient_service.service;

import com.smarthealthcare.patient_service.dto.CreateOrUpdateProfileRequest;
import com.smarthealthcare.patient_service.dto.PatientContactResponse;
import com.smarthealthcare.patient_service.dto.PatientProfileResponse;
import com.smarthealthcare.patient_service.dto.AppointmentAccessResponse;
import com.smarthealthcare.patient_service.dto.AuthUserResponse;
import com.smarthealthcare.patient_service.entity.PatientProfile;
import com.smarthealthcare.patient_service.exception.ResourceNotFoundException;
import com.smarthealthcare.patient_service.repository.PatientProfileRepository;
import com.smarthealthcare.patient_service.security.AuthenticatedPatient;
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
import java.util.Set;
import java.util.UUID;

@Service
public class PatientProfileService {

    private static final Logger logger = LoggerFactory.getLogger(PatientProfileService.class);
    private static final String DOCTOR_ROLE = "DOCTOR";

    private final PatientProfileRepository patientProfileRepository;
    private final Path profilePictureStorageLocation;
    private final RestClient appointmentServiceClient;
    private final RestClient authServiceClient;
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"
    );
    private static final long MAX_PROFILE_PICTURE_BYTES = 5 * 1024 * 1024;

    public PatientProfileService(PatientProfileRepository patientProfileRepository,
                                 @Value("${app.upload.dir:uploads}") String uploadDir,
                     @Value("${app.services.appointment.base-url:http://localhost:8082}") String appointmentServiceBaseUrl,
                     @Value("${app.services.auth.base-url:http://localhost:8080/auth}") String authServiceBaseUrl) {
        this.patientProfileRepository = patientProfileRepository;
        this.appointmentServiceClient = RestClient.builder()
                .baseUrl(appointmentServiceBaseUrl)
                .build();
        this.authServiceClient = RestClient.builder()
            .baseUrl(authServiceBaseUrl)
            .build();

        this.profilePictureStorageLocation = Paths
                .get(uploadDir, "profile-pictures")
                .toAbsolutePath()
                .normalize();

        try {
            Files.createDirectories(this.profilePictureStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create profile picture upload directory.", ex);
        }
    }

    private PatientProfile getOrCreateProfileEntity(Long authUserId) {
        return patientProfileRepository.findByAuthUserId(authUserId)
                .orElseGet(() -> {
                    PatientProfile newProfile = new PatientProfile();
                    newProfile.setAuthUserId(authUserId);
                    return patientProfileRepository.save(newProfile);
                });
    }

    /**
     * Finds the profile by authUserId. If it doesn't exist, auto-creates it.
     */
    @Transactional
    public PatientProfileResponse getOrCreateProfile(AuthenticatedPatient principal, String firstName, String lastName) {
        PatientProfile profile = getOrCreateProfileEntity(principal.getAuthUserId());
        syncIdentity(profile, principal);
        PatientProfile savedProfile = patientProfileRepository.save(profile);

        return PatientProfileResponse.fromEntity(savedProfile, firstName, lastName, principal.getEmail());
    }

    /**
     * Updates an existing profile via a request object.
     */
    @Transactional
    public PatientProfileResponse updateProfile(AuthenticatedPatient principal,
                                                String firstName, String lastName,
                                                CreateOrUpdateProfileRequest request) {
        PatientProfile profile = getOrCreateProfileEntity(principal.getAuthUserId());

        profile.setFirstName(sanitizeRequiredText(request.getFirstName()));
        profile.setLastName(sanitizeRequiredText(request.getLastName()));
        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setGender(request.getGender());
        profile.setBloodGroup(sanitizeOptionalText(request.getBloodGroup()));
        profile.setAddress(sanitizeRequiredText(request.getAddress()));
        profile.setEmergencyContactName(sanitizeOptionalText(request.getEmergencyContactName()));
        profile.setEmergencyContactPhone(sanitizeRequiredText(request.getEmergencyContactPhone()));
        profile.setAllergies(sanitizeOptionalText(request.getAllergies()));
        profile.setChronicConditions(sanitizeOptionalText(request.getChronicConditions()));
        profile.setBio(sanitizeOptionalText(request.getBio()));
        syncIdentity(profile, principal);

        PatientProfile savedProfile = patientProfileRepository.save(profile);
        return PatientProfileResponse.fromEntity(savedProfile, firstName, lastName, principal.getEmail());
    }

    @Transactional
    public PatientProfileResponse uploadProfilePicture(AuthenticatedPatient principal, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Profile picture file is required.");
        }

        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Only JPEG, PNG, WEBP, or GIF images are allowed.");
        }

        if (file.getSize() > MAX_PROFILE_PICTURE_BYTES) {
            throw new IllegalArgumentException("Profile picture size must be 5MB or less.");
        }

        PatientProfile profile = getOrCreateProfileEntity(principal.getAuthUserId());
        String previousFileName = profile.getProfilePictureUrl();

        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.lastIndexOf('.') > -1) {
            extension = originalFileName.substring(originalFileName.lastIndexOf('.'));
        }

        String newFileName = UUID.randomUUID() + extension;
        Path targetPath = this.profilePictureStorageLocation.resolve(newFileName).normalize();

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new RuntimeException("Could not store profile picture. Please try again.", ex);
        }

        profile.setProfilePictureUrl(newFileName);
        syncIdentity(profile, principal);
        PatientProfile saved = patientProfileRepository.saveAndFlush(profile);

        if (previousFileName != null && !previousFileName.isBlank() && !previousFileName.equals(newFileName)) {
            try {
                Files.deleteIfExists(this.profilePictureStorageLocation.resolve(previousFileName).normalize());
            } catch (IOException ignored) {
                // Best effort cleanup of old file.
            }
        }

        return PatientProfileResponse.fromEntity(saved, principal.getFirstName(), principal.getLastName(), principal.getEmail());
    }

    public Resource getProfilePictureResource(AuthenticatedPatient principal) {
        PatientProfile profile = getOrCreateProfileEntity(principal.getAuthUserId());
        String fileName = profile.getProfilePictureUrl();

        if (fileName == null || fileName.isBlank()) {
            throw new ResourceNotFoundException("Profile picture not found.");
        }

        Path filePath = this.profilePictureStorageLocation.resolve(fileName).normalize();
        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            }
            throw new ResourceNotFoundException("Profile picture file not found on server.");
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("Profile picture file not found on server.", ex);
        }
    }

    public String getProfilePictureContentType(AuthenticatedPatient principal) {
        PatientProfile profile = getOrCreateProfileEntity(principal.getAuthUserId());
        String fileName = profile.getProfilePictureUrl();

        if (fileName == null || fileName.isBlank()) {
            throw new ResourceNotFoundException("Profile picture not found.");
        }

        Path filePath = this.profilePictureStorageLocation.resolve(fileName).normalize();
        try {
            String contentType = Files.probeContentType(filePath);
            return contentType != null ? contentType : "application/octet-stream";
        } catch (IOException ex) {
            return "application/octet-stream";
        }
    }

    @Transactional
    public PatientProfileResponse deleteProfilePicture(AuthenticatedPatient principal) {
        PatientProfile profile = getOrCreateProfileEntity(principal.getAuthUserId());
        String fileName = profile.getProfilePictureUrl();

        if (fileName != null && !fileName.isBlank()) {
            try {
                Files.deleteIfExists(this.profilePictureStorageLocation.resolve(fileName).normalize());
            } catch (IOException ignored) {
                // Best effort cleanup of file.
            }
        }

        profile.setProfilePictureUrl(null);
        syncIdentity(profile, principal);
        PatientProfile saved = patientProfileRepository.saveAndFlush(profile);
        return PatientProfileResponse.fromEntity(saved, principal.getFirstName(), principal.getLastName(), principal.getEmail());
    }

    @Transactional(readOnly = true)
    public PatientProfileResponse getProfileForDoctor(Long doctorId, String doctorRole, Long patientAuthUserId) {
        validateDoctorAccess(doctorId, doctorRole, patientAuthUserId);

        PatientProfile profile = patientProfileRepository.findByAuthUserId(patientAuthUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        ensureIdentityPresent(profile);

        return PatientProfileResponse.fromEntity(
                profile,
                profile.getFirstName(),
                profile.getLastName(),
                profile.getEmail());
    }

        @Transactional(readOnly = true)
        public PatientContactResponse getContactByAuthUserId(Long authUserId) {
        PatientProfile profile = patientProfileRepository.findByAuthUserId(authUserId)
            .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        return PatientContactResponse.fromProfile(
            PatientProfileResponse.fromEntity(
                profile,
                profile.getFirstName(),
                profile.getLastName(),
                profile.getEmail()));
        }

        @Transactional(readOnly = true)
        public PatientContactResponse getContactByProfileId(Long patientProfileId) {
        PatientProfile profile = patientProfileRepository.findById(patientProfileId)
            .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        return PatientContactResponse.fromProfile(
            PatientProfileResponse.fromEntity(
                profile,
                profile.getFirstName(),
                profile.getLastName(),
                profile.getEmail()));
        }

    private void syncIdentity(PatientProfile profile, AuthenticatedPatient principal) {
        if (isBlank(profile.getFirstName())) {
            profile.setFirstName(sanitizeOptionalText(principal.getFirstName()));
        }

        if (isBlank(profile.getLastName())) {
            profile.setLastName(sanitizeOptionalText(principal.getLastName()));
        }

        profile.setEmail(principal.getEmail());
    }

    private String sanitizeRequiredText(String value) {
        return value == null ? null : value.trim();
    }

    private String sanitizeOptionalText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void validateDoctorAccess(Long doctorId, String doctorRole, Long patientAuthUserId) {
        if (doctorId == null) {
            throw new AccessDeniedException("Doctor id is required");
        }

        if (doctorRole == null || !DOCTOR_ROLE.equalsIgnoreCase(doctorRole)) {
            throw new AccessDeniedException("Only doctors can access patient profiles");
        }

        if (!hasDoctorAppointmentLink(doctorId, patientAuthUserId)) {
            throw new AccessDeniedException("Doctor is not authorized to access this patient's profile");
        }
    }

    private boolean hasDoctorAppointmentLink(Long doctorId, Long patientAuthUserId) {
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
            logger.error("Failed to validate doctor-patient profile access", ex);
            throw new IllegalStateException("Unable to validate profile access at this time");
        }
    }

    private void ensureIdentityPresent(PatientProfile profile) {
        boolean missingIdentity = isBlank(profile.getFirstName()) || isBlank(profile.getLastName()) || isBlank(profile.getEmail());
        if (!missingIdentity) {
            return;
        }

        try {
            AuthUserResponse user = authServiceClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/users/{id}").build(profile.getAuthUserId()))
                    .retrieve()
                    .body(AuthUserResponse.class);

            if (user == null) {
                return;
            }

            profile.setFirstName(user.getFirstName());
            profile.setLastName(user.getLastName());
            profile.setEmail(user.getEmail());
            patientProfileRepository.save(profile);
        } catch (RestClientException ex) {
            logger.warn("Unable to backfill patient identity from auth-service for authUserId={}", profile.getAuthUserId());
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
