package com.smarthealthcare.appointment_service.service;

import com.smarthealthcare.appointment_service.service.impl.AppointmentServiceImpl;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class PendingAppointmentExpiryScheduler {

    private final AppointmentServiceImpl appointmentService;

    public PendingAppointmentExpiryScheduler(AppointmentServiceImpl appointmentService) {
        this.appointmentService = appointmentService;
    }

    @Scheduled(fixedDelay = 300000)
    public void expirePendingAppointments() {
        appointmentService.expireStalePendingAppointments();
    }
}
