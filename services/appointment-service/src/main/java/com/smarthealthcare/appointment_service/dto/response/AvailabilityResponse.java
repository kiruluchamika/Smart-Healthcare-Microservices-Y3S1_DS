package com.smarthealthcare.appointment_service.dto.response;

import com.smarthealthcare.appointment_service.enums.AppointmentStatus;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class AvailabilityResponse {

    private Long doctorId;
    private LocalDate appointmentDate;
    private List<BookedSlot> bookedSlots = new ArrayList<>();
    private String message;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public LocalDate getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(LocalDate appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public List<BookedSlot> getBookedSlots() {
        return bookedSlots;
    }

    public void setBookedSlots(List<BookedSlot> bookedSlots) {
        this.bookedSlots = bookedSlots;
    }

    public static class BookedSlot {

        private Long appointmentId;
        private LocalTime startTime;
        private LocalTime endTime;
        private AppointmentStatus status;

        public Long getAppointmentId() {
            return appointmentId;
        }

        public void setAppointmentId(Long appointmentId) {
            this.appointmentId = appointmentId;
        }

        public LocalTime getStartTime() {
            return startTime;
        }

        public void setStartTime(LocalTime startTime) {
            this.startTime = startTime;
        }

        public LocalTime getEndTime() {
            return endTime;
        }

        public void setEndTime(LocalTime endTime) {
            this.endTime = endTime;
        }

        public AppointmentStatus getStatus() {
            return status;
        }

        public void setStatus(AppointmentStatus status) {
            this.status = status;
        }
    }
}
