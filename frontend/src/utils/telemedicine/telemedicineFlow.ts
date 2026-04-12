import type { AppointmentResponse } from '../../services/appointmentsApi';
import type { TelemedicineSessionResponse } from '../../services/telemedicineApi';

export type ConsultationRole = 'PATIENT' | 'DOCTOR';

export const ROOM_OPEN_LEAD_MINUTES = 15;

function toDate(date: string | undefined | null, time: string | undefined | null) {
  if (!date || !time) {
    return null;
  }

  return new Date(`${date}T${time}`);
}

export function getAppointmentStartDate(appointment: Pick<AppointmentResponse, 'appointmentDate' | 'startTime'>) {
  return toDate(appointment.appointmentDate, appointment.startTime);
}

export function getConsultationRoomOpenAt(appointment: Pick<AppointmentResponse, 'appointmentDate' | 'startTime'>) {
  const start = getAppointmentStartDate(appointment);
  if (!start) {
    return null;
  }

  return new Date(start.getTime() - ROOM_OPEN_LEAD_MINUTES * 60 * 1000);
}

export function isAppointmentPaymentSettled(
  appointment: Pick<AppointmentResponse, 'paymentStatusHint'> | null | undefined,
) {
  const paymentStatus = (appointment?.paymentStatusHint || '').toUpperCase();
  return paymentStatus === 'PAID' || paymentStatus === 'COMPLETED';
}

export function getConsultationAccessState(
  appointment: AppointmentResponse,
  session: TelemedicineSessionResponse | null | undefined,
  role: ConsultationRole,
  now = new Date(),
) {
  const sessionStatus = (session?.status || '').toUpperCase();
  const roomOpenAt = getConsultationRoomOpenAt(appointment);
  const roomWindowOpen = roomOpenAt ? now >= roomOpenAt : false;
  const paymentSettled = isAppointmentPaymentSettled(appointment);
  const isCompleted = sessionStatus === 'COMPLETED';
  const isStarted = sessionStatus === 'STARTED';
  const isCreated = !sessionStatus || sessionStatus === 'CREATED';

  if (appointment.appointmentType !== 'VIDEO') {
    return {
      canOpenPage: false,
      isCompleted: false,
      roomWindowOpen,
      roomOpenAt,
      primaryLabel: 'Video room unavailable',
      message: 'This appointment is not a video consultation.',
    };
  }

  if (appointment.status !== 'CONFIRMED' && appointment.status !== 'COMPLETED') {
    return {
      canOpenPage: false,
      isCompleted: false,
      roomWindowOpen,
      roomOpenAt,
      primaryLabel: 'Awaiting approval',
      message: 'Doctor approval is required before consultation access is available.',
    };
  }

  if (!paymentSettled) {
    return {
      canOpenPage: false,
      isCompleted: false,
      roomWindowOpen,
      roomOpenAt,
      primaryLabel: 'Payment required',
      message: 'Payment must be completed before the video consultation can begin.',
    };
  }

  if (isCompleted) {
    return {
      canOpenPage: true,
      isCompleted: true,
      roomWindowOpen: true,
      roomOpenAt,
      primaryLabel: 'Consultation closed',
      message: 'This consultation has ended and the room is no longer available.',
    };
  }

  if (!roomWindowOpen) {
    return {
      canOpenPage: true,
      isCompleted: false,
      roomWindowOpen: false,
      roomOpenAt,
      primaryLabel: 'Room opens soon',
      message: 'The consultation room opens 15 minutes before the scheduled start time.',
    };
  }

  if (role === 'DOCTOR') {
    return {
      canOpenPage: true,
      isCompleted: false,
      roomWindowOpen: true,
      roomOpenAt,
      primaryLabel: isStarted ? 'Join consultation' : 'Start consultation',
      message: isStarted
        ? 'The patient can join now. Re-enter the room to continue the consultation.'
        : isCreated
          ? 'Start the consultation to unlock patient access.'
          : 'Open the consultation workspace to continue.',
    };
  }

  return {
    canOpenPage: true,
    isCompleted: false,
    roomWindowOpen: true,
    roomOpenAt,
    primaryLabel: isStarted ? 'Join consultation' : 'Waiting for doctor',
    message: isStarted
      ? 'The doctor has started the session. You can join now.'
      : 'The doctor must start the consultation before you can join the room.',
  };
}
