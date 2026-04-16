package com.smarthealthcare.doctor_service.repository;

import com.smarthealthcare.doctor_service.entity.DoctorAvailability;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Long> {

    List<DoctorAvailability> findByDoctorIdOrderByDayOfWeekAscStartTimeAsc(Long doctorId);

    List<DoctorAvailability> findByDoctorId(Long doctorId);

    boolean existsByDoctorIdAndDayOfWeekAndStartTimeLessThanAndEndTimeGreaterThan(
            Long doctorId,
            DayOfWeek dayOfWeek,
            LocalTime endTime,
            LocalTime startTime);

    boolean existsByDoctorIdAndDayOfWeekAndStartTimeLessThanAndEndTimeGreaterThanAndIdNot(
            Long doctorId,
            DayOfWeek dayOfWeek,
            LocalTime endTime,
            LocalTime startTime,
            Long id);

    long countByDoctorId(Long doctorId);

    long countByDoctorIdAndAvailableTrue(Long doctorId);

    @Query("select distinct da.doctorId from DoctorAvailability da where da.dayOfWeek = :dayOfWeek and da.available = true")
    List<Long> findDistinctDoctorIdsByDayOfWeekAndAvailableTrue(DayOfWeek dayOfWeek);

    void deleteByDoctorId(Long doctorId);
}
