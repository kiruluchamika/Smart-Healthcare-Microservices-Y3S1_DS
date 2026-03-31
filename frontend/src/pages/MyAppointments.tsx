import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Loader2,
  MapPin,
  RefreshCw,
  Video,
} from 'lucide-react';
import {
  TEMP_DOCTORS,
  cancelAppointment,
  getDoctorAvailability,
  getMyAppointments,
  rescheduleAppointment,
  type AppointmentResponse,
} from '../services/appointmentsApi';

const APPOINTMENT_DURATION_MINUTES = 60;

function formatDateLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeLabel(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const normalizedHours = hours % 12 || 12;
  return `${normalizedHours}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function addMinutes(time: string, minutesToAdd: number) {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const nextHours = Math.floor(totalMinutes / 60);
  const nextMinutes = totalMinutes % 60;
  return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
}

function getNextSevenDates() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const isoDate = date.toISOString().split('T')[0];

    return {
      value: isoDate,
      label: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    };
  });
}

function getDefaultTimeSlots() {
  return ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
}

type AppointmentGroup = {
  title: string;
  description: string;
  appointments: AppointmentResponse[];
};

export default function MyAppointments() {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeRescheduleId, setActiveRescheduleId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [rescheduleError, setRescheduleError] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const dateOptions = useMemo(() => getNextSevenDates(), []);

  const loadAppointments = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getMyAppointments();
      setAppointments(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAppointments();
  }, []);

  const groupedAppointments = useMemo<AppointmentGroup[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = appointments.filter((appointment) => {
      const appointmentDate = new Date(`${appointment.appointmentDate}T00:00:00`);
      return (
        (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') &&
        appointmentDate >= today
      );
    });

    const completed = appointments.filter((appointment) => appointment.status === 'COMPLETED');
    const cancelled = appointments.filter((appointment) => appointment.status === 'CANCELLED');
    const other = appointments.filter(
      (appointment) =>
        !upcoming.includes(appointment) &&
        !completed.includes(appointment) &&
        !cancelled.includes(appointment),
    );

    return [
      {
        title: 'Upcoming',
        description: 'Appointments that are pending or confirmed.',
        appointments: upcoming,
      },
      {
        title: 'Completed',
        description: 'Appointments that have already been completed.',
        appointments: completed,
      },
      {
        title: 'Cancelled',
        description: 'Appointments that were cancelled.',
        appointments: cancelled,
      },
      {
        title: 'Other',
        description: 'Rejected or past appointments outside the main groups.',
        appointments: other,
      },
    ].filter((group) => group.appointments.length > 0);
  }, [appointments]);

  const getDoctorDetails = (doctorId: number) =>
    TEMP_DOCTORS.find((doctor) => doctor.id === doctorId) || null;

  const openReschedule = (appointment: AppointmentResponse) => {
    setActiveRescheduleId(appointment.id);
    setRescheduleDate(appointment.appointmentDate);
    setRescheduleTime('');
    setRescheduleSlots([]);
    setRescheduleError('');
  };

  useEffect(() => {
    if (!activeRescheduleId || !rescheduleDate) {
      return;
    }

    const appointment = appointments.find((item) => item.id === activeRescheduleId);
    if (!appointment) {
      return;
    }

    let isActive = true;

    const loadSlots = async () => {
      setIsLoadingSlots(true);
      setRescheduleError('');

      try {
        const response = await getDoctorAvailability(appointment.doctorId, rescheduleDate);
        const bookedStartTimes = new Set(
          response.bookedSlots
            .filter((slot) => slot.appointmentId !== appointment.id)
            .map((slot) => slot.startTime.slice(0, 5)),
        );

        const availableSlots = getDefaultTimeSlots().filter((slot) => !bookedStartTimes.has(slot));

        if (isActive) {
          setRescheduleSlots(availableSlots);

          if (rescheduleTime && bookedStartTimes.has(rescheduleTime)) {
            setRescheduleTime('');
          }
        }
      } catch (loadError) {
        if (isActive) {
          setRescheduleSlots([]);
          setRescheduleError(
            loadError instanceof Error ? loadError.message : 'Failed to load reschedule slots',
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingSlots(false);
        }
      }
    };

    void loadSlots();

    return () => {
      isActive = false;
    };
  }, [activeRescheduleId, appointments, rescheduleDate, rescheduleTime]);

  const handleCancel = async (appointmentId: number) => {
    setActionLoadingId(appointmentId);
    setError('');

    try {
      await cancelAppointment(appointmentId);
      await loadAppointments();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to cancel appointment');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReschedule = async (appointment: AppointmentResponse) => {
    if (!rescheduleDate || !rescheduleTime) {
      setRescheduleError('Please select a new date and time');
      return;
    }

    setActionLoadingId(appointment.id);
    setRescheduleError('');

    try {
      await rescheduleAppointment(appointment.id, {
        appointmentDate: rescheduleDate,
        startTime: rescheduleTime,
        endTime: addMinutes(rescheduleTime, APPOINTMENT_DURATION_MINUTES),
      });
      setActiveRescheduleId(null);
      setRescheduleTime('');
      setRescheduleSlots([]);
      await loadAppointments();
    } catch (actionError) {
      setRescheduleError(
        actionError instanceof Error ? actionError.message : 'Failed to reschedule appointment',
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Appointments</h1>
          <p className="text-gray-600">Track upcoming visits and manage your appointment requests.</p>
        </motion.div>

        {error && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-600">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-gray-200/40 bg-white p-10 text-center shadow-lg">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading your appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-2xl border border-gray-200/40 bg-white p-10 text-center shadow-lg">
            <Calendar className="mx-auto mb-4 h-10 w-10 text-blue-600" />
            <h2 className="mb-2 text-2xl font-bold text-gray-900">No Appointments Yet</h2>
            <p className="text-gray-600">Once you book an appointment, it will appear here.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {groupedAppointments.map((group) => (
              <section key={group.title}>
                <div className="mb-5">
                  <h2 className="text-2xl font-bold text-gray-900">{group.title}</h2>
                  <p className="text-sm text-gray-600">{group.description}</p>
                </div>

                <div className="space-y-4">
                  {group.appointments.map((appointment) => {
                    const doctor = getDoctorDetails(appointment.doctorId);
                    const canCancel =
                      appointment.status === 'PENDING' || appointment.status === 'CONFIRMED';
                    const canReschedule =
                      appointment.status === 'PENDING' || appointment.status === 'CONFIRMED';
                    const isRescheduling = activeRescheduleId === appointment.id;
                    const isBusy = actionLoadingId === appointment.id;

                    return (
                      <motion.div
                        key={appointment.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-gray-200/40 bg-white p-5 shadow-lg"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <h3 className="text-xl font-semibold text-gray-900">
                                {doctor?.name || `Doctor #${appointment.doctorId}`}
                              </h3>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  appointment.status === 'CONFIRMED'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : appointment.status === 'PENDING'
                                      ? 'bg-amber-100 text-amber-700'
                                      : appointment.status === 'COMPLETED'
                                        ? 'bg-blue-100 text-blue-700'
                                        : appointment.status === 'CANCELLED'
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {appointment.status}
                              </span>
                            </div>

                            <p className="mb-3 text-sm text-gray-600">
                              {doctor?.specialty || 'Specialty unavailable'}
                            </p>

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600">
                              <span className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                {formatDateLabel(appointment.appointmentDate)}
                              </span>
                              <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                {formatTimeLabel(appointment.startTime)} -{' '}
                                {formatTimeLabel(appointment.endTime)}
                              </span>
                              <span className="flex items-center gap-2">
                                {appointment.appointmentType === 'VIDEO' ? (
                                  <Video className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <MapPin className="h-4 w-4 text-blue-600" />
                                )}
                                {appointment.appointmentType === 'VIDEO'
                                  ? 'Video Consultation'
                                  : 'In-Person Visit'}
                              </span>
                            </div>

                            <div className="mt-4 rounded-xl bg-blue-50/70 px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                Reason for Visit
                              </p>
                              <p className="mt-1 text-sm text-gray-700">{appointment.reasonForVisit}</p>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                            <button
                              type="button"
                              disabled={!canReschedule || isBusy}
                              onClick={() =>
                                isRescheduling ? setActiveRescheduleId(null) : openReschedule(appointment)
                              }
                              className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Reschedule
                            </button>
                            <button
                              type="button"
                              disabled={!canCancel || isBusy}
                              onClick={() => void handleCancel(appointment.id)}
                              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isBusy && !isRescheduling ? 'Working...' : 'Cancel'}
                            </button>
                          </div>
                        </div>

                        {isRescheduling && (
                          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                            <div className="mb-4 flex items-center gap-2 text-blue-700">
                              <RefreshCw className="h-4 w-4" />
                              <h4 className="font-semibold">Reschedule Appointment</h4>
                            </div>

                            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
                              {dateOptions.map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => {
                                    setRescheduleDate(option.value);
                                    setRescheduleTime('');
                                  }}
                                  className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${
                                    rescheduleDate === option.value
                                      ? 'border-blue-600 bg-blue-600 text-white'
                                      : 'border-blue-100 bg-white text-gray-700 hover:border-blue-300'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>

                            {isLoadingSlots ? (
                              <div className="mb-4 flex items-center gap-2 text-blue-600">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading available time slots...
                              </div>
                            ) : (
                              <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                                {rescheduleSlots.map((slot) => (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setRescheduleTime(slot)}
                                    className={`rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                                      rescheduleTime === slot
                                        ? 'border-blue-600 bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                                        : 'border-blue-100 bg-white text-gray-700 hover:border-blue-300'
                                    }`}
                                  >
                                    {formatTimeLabel(slot)}
                                  </button>
                                ))}
                              </div>
                            )}

                            {!isLoadingSlots && rescheduleSlots.length === 0 && !rescheduleError && (
                              <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                                No reschedule slots are available for this date.
                              </div>
                            )}

                            {rescheduleError && (
                              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                {rescheduleError}
                              </div>
                            )}

                            <div className="flex flex-col gap-3 sm:flex-row">
                              <button
                                type="button"
                                disabled={!rescheduleTime || isBusy}
                                onClick={() => void handleReschedule(appointment)}
                                className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isBusy ? 'Saving...' : 'Confirm Reschedule'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveRescheduleId(null)}
                                className="rounded-lg border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-white"
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
