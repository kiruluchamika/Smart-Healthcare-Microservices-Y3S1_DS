package com.smarthealthcare.telemedicine_service.service.impl;

import com.smarthealthcare.telemedicine_service.dto.request.CreateTelemedicineSessionRequest;
import com.smarthealthcare.telemedicine_service.dto.response.TelemedicineSessionResponse;
import com.smarthealthcare.telemedicine_service.entity.TelemedicineSession;
import com.smarthealthcare.telemedicine_service.entity.TelemedicineSessionStatus;
import com.smarthealthcare.telemedicine_service.exception.ConflictException;
import com.smarthealthcare.telemedicine_service.exception.ResourceNotFoundException;
import com.smarthealthcare.telemedicine_service.repository.TelemedicineSessionRepository;
import java.util.Optional;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

class TelemedicineSessionServiceImplTest {

    private TelemedicineSessionRepository repository;
    private TelemedicineSessionServiceImpl service;

    @BeforeEach
    void setUp() {
        repository = Mockito.mock(TelemedicineSessionRepository.class);
        service = new TelemedicineSessionServiceImpl(repository);
    }

    @Test
    void createSessionBuildsJitsiRoomAndMeetingUrl() {
        Mockito.when(repository.findByAppointmentId(11L)).thenReturn(Optional.empty());
        Mockito.when(repository.save(Mockito.any(TelemedicineSession.class))).thenAnswer(invocation -> {
            TelemedicineSession session = invocation.getArgument(0);
            session.setId(5L);
            return session;
        });

        TelemedicineSessionResponse response = service.createSession(new CreateTelemedicineSessionRequest(11L));

        Assertions.assertEquals("5", response.sessionId());
        Assertions.assertEquals(11L, response.appointmentId());
        Assertions.assertEquals("appointment-11", response.roomId());
        Assertions.assertEquals("https://meet.jit.si/appointment-11", response.meetingUrl());
        Assertions.assertEquals("CREATED", response.status());

        ArgumentCaptor<TelemedicineSession> captor = ArgumentCaptor.forClass(TelemedicineSession.class);
        Mockito.verify(repository).save(captor.capture());
        Assertions.assertEquals(TelemedicineSessionStatus.CREATED, captor.getValue().getStatus());
    }

    @Test
    void createSessionReturnsExistingRecordForDuplicateAppointment() {
        TelemedicineSession existing = new TelemedicineSession();
        existing.setId(9L);
        existing.setAppointmentId(22L);
        existing.setRoomId("appointment-22");
        existing.setMeetingUrl("https://meet.jit.si/appointment-22");
        existing.setStatus(TelemedicineSessionStatus.STARTED);

        Mockito.when(repository.findByAppointmentId(22L)).thenReturn(Optional.of(existing));

        TelemedicineSessionResponse response = service.createSession(new CreateTelemedicineSessionRequest(22L));

        Assertions.assertEquals("9", response.sessionId());
        Assertions.assertEquals("STARTED", response.status());
        Mockito.verify(repository, Mockito.never()).save(Mockito.any());
    }

    @Test
    void completeSessionRequiresStartedState() {
        TelemedicineSession session = new TelemedicineSession();
        session.setId(7L);
        session.setAppointmentId(33L);
        session.setRoomId("appointment-33");
        session.setMeetingUrl("https://meet.jit.si/appointment-33");
        session.setStatus(TelemedicineSessionStatus.CREATED);

        Mockito.when(repository.findById(7L)).thenReturn(Optional.of(session));

        Assertions.assertThrows(ConflictException.class, () -> service.completeSession(7L));
    }

    @Test
    void startAndCompleteSessionUpdateStatuses() {
        TelemedicineSession session = new TelemedicineSession();
        session.setId(8L);
        session.setAppointmentId(44L);
        session.setRoomId("appointment-44");
        session.setMeetingUrl("https://meet.jit.si/appointment-44");
        session.setStatus(TelemedicineSessionStatus.CREATED);

        Mockito.when(repository.findById(8L)).thenReturn(Optional.of(session));
        Mockito.when(repository.save(Mockito.any(TelemedicineSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TelemedicineSessionResponse started = service.startSession(8L);
        Assertions.assertEquals("STARTED", started.status());

        session.setStatus(TelemedicineSessionStatus.STARTED);
        TelemedicineSessionResponse completed = service.completeSession(8L);
        Assertions.assertEquals("COMPLETED", completed.status());
    }

    @Test
    void getSessionByAppointmentIdThrowsWhenMissing() {
        Mockito.when(repository.findByAppointmentId(99L)).thenReturn(Optional.empty());

        Assertions.assertThrows(ResourceNotFoundException.class, () -> service.getSessionByAppointmentId(99L));
    }
}