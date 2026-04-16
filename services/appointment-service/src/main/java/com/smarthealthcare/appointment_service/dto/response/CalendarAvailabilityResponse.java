package com.smarthealthcare.appointment_service.dto.response;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class CalendarAvailabilityResponse {

    private Long doctorId;
    private LocalDate rangeStart;
    private LocalDate rangeEnd;
    private List<DateAvailability> dates = new ArrayList<>();

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public LocalDate getRangeStart() {
        return rangeStart;
    }

    public void setRangeStart(LocalDate rangeStart) {
        this.rangeStart = rangeStart;
    }

    public LocalDate getRangeEnd() {
        return rangeEnd;
    }

    public void setRangeEnd(LocalDate rangeEnd) {
        this.rangeEnd = rangeEnd;
    }

    public List<DateAvailability> getDates() {
        return dates;
    }

    public void setDates(List<DateAvailability> dates) {
        this.dates = dates;
    }

    public static class DateAvailability {

        private LocalDate appointmentDate;
        private boolean availableOnDate;
        private boolean hasAvailableSlots;
        private String message;

        public LocalDate getAppointmentDate() {
            return appointmentDate;
        }

        public void setAppointmentDate(LocalDate appointmentDate) {
            this.appointmentDate = appointmentDate;
        }

        public boolean isAvailableOnDate() {
            return availableOnDate;
        }

        public void setAvailableOnDate(boolean availableOnDate) {
            this.availableOnDate = availableOnDate;
        }

        public boolean getHasAvailableSlots() {
            return hasAvailableSlots;
        }

        public void setHasAvailableSlots(boolean hasAvailableSlots) {
            this.hasAvailableSlots = hasAvailableSlots;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
