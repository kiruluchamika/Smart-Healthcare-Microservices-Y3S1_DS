package com.smarthealthcare.appointment_service.service;

import com.smarthealthcare.appointment_service.dto.request.CreateAppointmentRequest;
import com.smarthealthcare.appointment_service.dto.request.RescheduleAppointmentRequest;
import com.smarthealthcare.appointment_service.dto.request.AcceptAppointmentRequest;
import com.smarthealthcare.appointment_service.dto.request.UpdateAppointmentPaymentStatusRequest;
import com.smarthealthcare.appointment_service.dto.response.ApiMessageResponse;
import com.smarthealthcare.appointment_service.dto.response.AppointmentResponse;
import com.smarthealthcare.appointment_service.dto.response.AvailabilityResponse;
import com.smarthealthcare.appointment_service.dto.response.CalendarAvailabilityResponse;
import java.time.LocalDate;
import java.util.List;

public interface AppointmentService {

    AppointmentResponse createAppointment(CreateAppointmentRequest request);

    AppointmentResponse getAppointmentById(Long appointmentId);

    List<AppointmentResponse> getMyAppointments(Long patientId);

    List<AppointmentResponse> getAppointmentsByPatientId(Long patientId);

    List<AppointmentResponse> getMyDoctorAppointments(Long doctorId);

    List<AppointmentResponse> getAppointmentsByDoctorId(Long doctorId);

    AppointmentResponse rescheduleAppointment(Long appointmentId, Long patientId, RescheduleAppointmentRequest request);

    ApiMessageResponse cancelAppointment(Long appointmentId, Long patientId);

    AppointmentResponse acceptAppointment(Long appointmentId, Long doctorId, AcceptAppointmentRequest request);

    AppointmentResponse rejectAppointment(Long appointmentId, Long doctorId);

    AppointmentResponse completeAppointment(Long appointmentId, Long doctorId);

    AppointmentResponse updatePaymentStatus(Long appointmentId, UpdateAppointmentPaymentStatusRequest request);

    AvailabilityResponse getDoctorAvailability(Long doctorId, LocalDate appointmentDate);

    CalendarAvailabilityResponse getDoctorAvailabilityCalendar(Long doctorId, LocalDate rangeStart, LocalDate rangeEnd);

    boolean hasDoctorCompletedAppointmentWithPatient(Long doctorId, Long patientId);
}
