package com.smarthealthcare.doctor_service.service;

import com.smarthealthcare.doctor_service.dto.DoctorResponse;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface DoctorProfilePictureService {

    DoctorResponse uploadProfilePicture(Long doctorId, MultipartFile file);

    Resource getProfilePictureResource(Long doctorId);

    String getProfilePictureContentType(Long doctorId);

    void deleteProfilePicture(Long doctorId);
}
