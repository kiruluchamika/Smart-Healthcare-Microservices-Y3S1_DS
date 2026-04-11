package com.smarthealthcare.doctor_service.config;

import com.smarthealthcare.doctor_service.entity.Doctor;
import com.smarthealthcare.doctor_service.entity.DoctorAvailability;
import com.smarthealthcare.doctor_service.enums.OnboardingState;
import com.smarthealthcare.doctor_service.enums.VerificationStatus;
import com.smarthealthcare.doctor_service.repository.DoctorAvailabilityRepository;
import com.smarthealthcare.doctor_service.repository.DoctorRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class SampleDataConfig {

        private final DoctorRepository doctorRepository;
        private final DoctorAvailabilityRepository availabilityRepository;

        @Bean
        @ConditionalOnProperty(name = "app.seed-data", havingValue = "true")
        CommandLineRunner loadSampleDoctorData() {
                return args -> {
                        if (doctorRepository.count() > 0) {
                                return;
                        }

                        Doctor cardiologist = doctorRepository.save(Doctor.builder()
                                        .firstName("Ayesha")
                                        .lastName("Perera")
                                        .email("ayesha.perera@smarthealthcare.com")
                                        .phone("+94770000001")
                                        .specialization("Cardiologist")
                                        .qualifications("MBBS, MD Cardiology")
                                        .experienceYears(12)
                                        .licenseNumber("SLMC-CAR-001")
                                        .bio("Senior cardiologist focused on preventive heart care.")
                                        .boardCertifications("Board Certified in Cardiovascular Medicine")
                                        .languagesSpoken("English, Sinhala, Tamil")
                                        .clinicLocations("City Heart Clinic, Colombo")
                                        .insuranceProviders("AIA, Allianz, Union Assurance")
                                        .licenseExpiryDate(LocalDate.of(2028, 12, 31))
                                        .verificationStatus(VerificationStatus.APPROVED)
                                        .active(true)
                                        .onboardingState(OnboardingState.VERIFIED)
                                        .profileCompletenessScore(100)
                                        .build());

                        Doctor neurologist = doctorRepository.save(Doctor.builder()
                                        .firstName("Nimal")
                                        .lastName("Fernando")
                                        .email("nimal.fernando@smarthealthcare.com")
                                        .phone("+94770000002")
                                        .specialization("Neurologist")
                                        .qualifications("MBBS, MD Neurology")
                                        .experienceYears(8)
                                        .licenseNumber("SLMC-NEU-002")
                                        .bio("Neurologist with special interest in stroke recovery.")
                                        .boardCertifications("Board Certified in Neurology")
                                        .languagesSpoken("English, Sinhala")
                                        .clinicLocations("Neuro Care Center, Kandy")
                                        .insuranceProviders("AIA, NDB")
                                        .licenseExpiryDate(LocalDate.of(2027, 6, 30))
                                        .verificationStatus(VerificationStatus.PENDING)
                                        .active(true)
                                        .onboardingState(OnboardingState.SUBMITTED)
                                        .profileCompletenessScore(100)
                                        .build());

                        availabilityRepository.save(DoctorAvailability.builder()
                                        .doctorId(cardiologist.getId())
                                        .dayOfWeek(DayOfWeek.MONDAY)
                                        .startTime(LocalTime.of(9, 0))
                                        .endTime(LocalTime.of(12, 0))
                                        .available(true)
                                        .build());

                        availabilityRepository.save(DoctorAvailability.builder()
                                        .doctorId(cardiologist.getId())
                                        .dayOfWeek(DayOfWeek.WEDNESDAY)
                                        .startTime(LocalTime.of(14, 0))
                                        .endTime(LocalTime.of(17, 0))
                                        .available(true)
                                        .build());

                        availabilityRepository.save(DoctorAvailability.builder()
                                        .doctorId(neurologist.getId())
                                        .dayOfWeek(DayOfWeek.TUESDAY)
                                        .startTime(LocalTime.of(10, 0))
                                        .endTime(LocalTime.of(13, 0))
                                        .available(true)
                                        .build());
                };
        }
}
