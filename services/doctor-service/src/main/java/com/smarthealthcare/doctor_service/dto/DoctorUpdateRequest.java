package com.smarthealthcare.doctor_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DoctorUpdateRequest {

    @NotBlank(message = "First name is required")
    @Size(max = 80, message = "First name must not exceed 80 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 80, message = "Last name must not exceed 80 characters")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 120, message = "Email must not exceed 120 characters")
    private String email;

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^\\+?[0-9]{9,15}$", message = "Phone must be a valid number")
    private String phone;

    @NotBlank(message = "Specialization is required")
    @Size(max = 120, message = "Specialization must not exceed 120 characters")
    private String specialization;

    @NotBlank(message = "Qualifications are required")
    @Size(max = 300, message = "Qualifications must not exceed 300 characters")
    private String qualifications;

    @NotNull(message = "Experience years is required")
    @Min(value = 0, message = "Experience years cannot be negative")
    @Max(value = 60, message = "Experience years must be realistic")
    private Integer experienceYears;

    @NotBlank(message = "License number is required")
    @Size(max = 100, message = "License number must not exceed 100 characters")
    private String licenseNumber;

    @Size(max = 2500, message = "Bio must not exceed 2500 characters")
    private String bio;

    @Size(max = 500, message = "Board certifications must not exceed 500 characters")
    private String boardCertifications;

    @Size(max = 300, message = "Languages spoken must not exceed 300 characters")
    private String languagesSpoken;

    @Size(max = 500, message = "Clinic locations must not exceed 500 characters")
    private String clinicLocations;

    @Size(max = 500, message = "Insurance providers must not exceed 500 characters")
    private String insuranceProviders;

    @FutureOrPresent(message = "License expiry date must be today or later")
    private LocalDate licenseExpiryDate;
}
