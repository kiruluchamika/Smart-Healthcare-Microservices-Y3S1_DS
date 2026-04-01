package com.smarthealthcare.patient_service.service;

import com.smarthealthcare.patient_service.dto.CreateOrUpdateProfileRequest;
import com.smarthealthcare.patient_service.dto.PatientProfileResponse;
import com.smarthealthcare.patient_service.entity.PatientProfile;
import com.smarthealthcare.patient_service.exception.ResourceNotFoundException;
import com.smarthealthcare.patient_service.repository.PatientProfileRepository;
import com.smarthealthcare.patient_service.security.AuthenticatedPatient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

    private final PatientProfileRepository patientProfileRepository;
    private final Path profilePictureStorageLocation;
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"
    );
    private static final long MAX_PROFILE_PICTURE_BYTES = 5 * 1024 * 1024;

    public PatientProfileService(PatientProfileRepository patientProfileRepository,
                                 @Value("${app.upload.dir:uploads}") String uploadDir) {
        this.patientProfileRepository = patientProfileRepository;

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

        return PatientProfileResponse.fromEntity(profile, firstName, lastName, principal.getEmail());
    }

    /**
     * Updates an existing profile via a request object.
     */
    @Transactional
    public PatientProfileResponse updateProfile(AuthenticatedPatient principal,
                                                String firstName, String lastName,
                                                CreateOrUpdateProfileRequest request) {
        PatientProfile profile = getOrCreateProfileEntity(principal.getAuthUserId());

        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setGender(request.getGender());
        profile.setBloodGroup(request.getBloodGroup());
        profile.setAddress(request.getAddress());
        profile.setEmergencyContactName(request.getEmergencyContactName());
        profile.setEmergencyContactPhone(request.getEmergencyContactPhone());
        profile.setAllergies(request.getAllergies());
        profile.setChronicConditions(request.getChronicConditions());
        profile.setBio(request.getBio());

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
        PatientProfile saved = patientProfileRepository.save(profile);

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
        PatientProfile saved = patientProfileRepository.save(profile);
        return PatientProfileResponse.fromEntity(saved, principal.getFirstName(), principal.getLastName(), principal.getEmail());
    }
}
