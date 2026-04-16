package com.smarthealthcare.doctor_service.service.impl;

import com.smarthealthcare.doctor_service.dto.DoctorResponse;
import com.smarthealthcare.doctor_service.entity.Doctor;
import com.smarthealthcare.doctor_service.exception.BadRequestException;
import com.smarthealthcare.doctor_service.exception.ResourceNotFoundException;
import com.smarthealthcare.doctor_service.mapper.DoctorMapper;
import com.smarthealthcare.doctor_service.repository.DoctorRepository;
import com.smarthealthcare.doctor_service.service.DoctorProfilePictureService;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DoctorProfilePictureServiceImpl implements DoctorProfilePictureService {

    private static final long MAX_PROFILE_PICTURE_BYTES = 5 * 1024 * 1024;
    private static final Map<String, String> CONTENT_TYPE_TO_EXTENSION = Map.of(
            "image/jpeg", ".jpg",
            "image/jpg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif");

    private final DoctorRepository doctorRepository;
    private final DoctorMapper doctorMapper;

    private final Path profilePictureStorageLocation;

    public DoctorProfilePictureServiceImpl(
            DoctorRepository doctorRepository,
            DoctorMapper doctorMapper,
            @Value("${app.upload.dir:uploads}") String uploadDir) {
        this.doctorRepository = doctorRepository;
        this.doctorMapper = doctorMapper;
        this.profilePictureStorageLocation = Paths.get(uploadDir, "profile-pictures").toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.profilePictureStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create profile picture upload directory.", ex);
        }
    }

    @Override
    @Transactional
    public DoctorResponse uploadProfilePicture(Long doctorId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Profile picture file is required.");
        }

        String contentType = normalizedContentType(file.getContentType());
        String extension = CONTENT_TYPE_TO_EXTENSION.get(contentType);
        if (extension == null) {
            throw new BadRequestException("Only JPEG, PNG, WEBP, or GIF images are allowed.");
        }

        if (file.getSize() > MAX_PROFILE_PICTURE_BYTES) {
            throw new BadRequestException("Profile picture size must be 5MB or less.");
        }

        Doctor doctor = findDoctorOrThrow(doctorId);
        deletePictureFilesIfExists(doctorId);

        Path targetFile = this.profilePictureStorageLocation.resolve(buildStoredFileName(doctorId, extension));

        try {
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new RuntimeException("Could not store profile picture. Please try again.", ex);
        }

        doctor.setProfilePictureUrl(buildPublicUrl(doctorId));
        Doctor savedDoctor = doctorRepository.saveAndFlush(doctor);
        return doctorMapper.toResponse(savedDoctor);
    }

    @Override
    @Transactional(readOnly = true)
    public Resource getProfilePictureResource(Long doctorId) {
        Doctor doctor = findDoctorOrThrow(doctorId);

        if (doctor.getProfilePictureUrl() == null || doctor.getProfilePictureUrl().isBlank()) {
            throw new ResourceNotFoundException("Profile picture not found.");
        }

        Path profilePicturePath = findStoredPicturePath(doctorId);

        try {
            Resource resource = new UrlResource(profilePicturePath.toUri());
            if (resource.exists()) {
                return resource;
            }
            throw new ResourceNotFoundException("Profile picture file not found on server.");
        } catch (Exception ex) {
            throw new ResourceNotFoundException("Profile picture file not found on server.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public String getProfilePictureContentType(Long doctorId) {
        findDoctorOrThrow(doctorId);
        Path profilePicturePath = findStoredPicturePath(doctorId);

        try {
            String contentType = Files.probeContentType(profilePicturePath);
            return contentType != null ? contentType : "application/octet-stream";
        } catch (IOException ex) {
            return "application/octet-stream";
        }
    }

    @Override
    @Transactional
    public void deleteProfilePicture(Long doctorId) {
        Doctor doctor = findDoctorOrThrow(doctorId);
        deletePictureFilesIfExists(doctorId);
        doctor.setProfilePictureUrl(null);
        doctorRepository.saveAndFlush(doctor);
    }

    private Doctor findDoctorOrThrow(Long doctorId) {
        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));
    }

    private Path findStoredPicturePath(Long doctorId) {
        for (String extension : CONTENT_TYPE_TO_EXTENSION.values()) {
            Path filePath = this.profilePictureStorageLocation.resolve(buildStoredFileName(doctorId, extension));
            if (Files.exists(filePath)) {
                return filePath;
            }
        }

        throw new ResourceNotFoundException("Profile picture file not found on server.");
    }

    private void deletePictureFilesIfExists(Long doctorId) {
        for (String extension : CONTENT_TYPE_TO_EXTENSION.values()) {
            Path filePath = this.profilePictureStorageLocation.resolve(buildStoredFileName(doctorId, extension));
            try {
                Files.deleteIfExists(filePath);
            } catch (IOException ignored) {
                // Best effort cleanup of old files.
            }
        }
    }

    private String buildStoredFileName(Long doctorId, String extension) {
        return "doctor-" + doctorId + extension;
    }

    private String buildPublicUrl(Long doctorId) {
        return "/api/doctors/" + doctorId + "/profile-picture";
    }

    private String normalizedContentType(String contentType) {
        if (contentType == null) {
            return "";
        }
        return contentType.toLowerCase(Locale.ROOT).trim();
    }
}
