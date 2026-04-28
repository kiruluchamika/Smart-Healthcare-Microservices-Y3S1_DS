package com.smarthealthcare.appointment_service.dto.integration;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class DoctorAvailabilityLookupResponse {

    private Long id;
    private Long doctorId;
    private DayOfWeek dayOfWeek;
    private List<DayOfWeek> daysOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer slotDuration;
    private Boolean isAvailable;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public DayOfWeek getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(DayOfWeek dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public List<DayOfWeek> getDaysOfWeek() {
        return daysOfWeek;
    }

    public void setDaysOfWeek(List<DayOfWeek> daysOfWeek) {
        this.daysOfWeek = daysOfWeek;
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

    public Integer getSlotDuration() {
        return slotDuration;
    }

    public void setSlotDuration(Integer slotDuration) {
        this.slotDuration = slotDuration;
    }

    public Boolean getIsAvailable() {
        return isAvailable;
    }

    public void setIsAvailable(Boolean available) {
        isAvailable = available;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(LocalDate effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public LocalDate getEffectiveTo() {
        return effectiveTo;
    }

    public void setEffectiveTo(LocalDate effectiveTo) {
        this.effectiveTo = effectiveTo;
    }

    public boolean appliesTo(DayOfWeek targetDay) {
        if (daysOfWeek != null && !daysOfWeek.isEmpty()) {
            return daysOfWeek.contains(targetDay);
        }

        return dayOfWeek == targetDay;
    }
}
