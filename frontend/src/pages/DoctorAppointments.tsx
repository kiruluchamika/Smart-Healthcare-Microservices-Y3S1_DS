import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Loader2, MapPin, Video } from 'lucide-react';
import {
  acceptAppointment,
  completeAppointment,
  getMyDoctorAppointments,
  rejectAppointment,
  type AppointmentResponse,
} from '../services/appointmentsApi';

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

type AppointmentGroup = {
  title: string;
  description: string;
  appointments: AppointmentResponse[];
};

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const loadAppointments = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getMyDoctorAppointments();
      setAppointments(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load doctor appointments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAppointments();
  }, []);

  const groupedAppointments = useMemo<AppointmentGroup[]>(() => {
    const pending = appointments.filter((appointment) => appointment.status === 'PENDING');
    const confirmed = appointments.filter((appointment) => appointment.status === 'CONFIRMED');
    const completed = appointments.filter((appointment) => appointment.status === 'COMPLETED');
    const other = appointments.filter(
      (appointment) =>
        appointment.status !== 'PENDING' &&
        appointment.status !== 'CONFIRMED' &&
        appointment.status !== 'COMPLETED',
    );

    return [
      {
        title: 'Pending Requests',
        description: 'New appointment requests waiting for your decision.',
        appointments: pending,
      },
      {
        title: 'Confirmed Appointments',
        description: 'Appointments that are accepted and ready for consultation.',
        appointments: confirmed,
      },
      {
        title: 'Completed Appointments',
        description: 'Appointments you have already completed.',
        appointments: completed,
      },
      {
        title: 'Other Statuses',
        description: 'Rejected or cancelled appointments for reference.',
        appointments: other,
      },
    ].filter((group) => group.appointments.length > 0);
  }, [appointments]);

  const handleAction = async (
    appointmentId: number,
    action: (targetId: number) => Promise<AppointmentResponse>,
  ) => {
    setActionLoadingId(appointmentId);
    setError('');

    try {
      await action(appointmentId);
      await loadAppointments();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to update appointment');
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Doctor Appointments</h1>
          <p className="text-gray-600">Review, confirm, and complete appointments assigned to you.</p>
        </motion.div>

        {error && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-600">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-gray-200/40 bg-white p-10 text-center shadow-lg">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading assigned appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-2xl border border-gray-200/40 bg-white p-10 text-center shadow-lg">
            <Calendar className="mx-auto mb-4 h-10 w-10 text-blue-600" />
            <h2 className="mb-2 text-2xl font-bold text-gray-900">No Doctor Appointments Yet</h2>
            <p className="text-gray-600">Assigned appointments will appear here once patients book with you.</p>
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
                    const isBusy = actionLoadingId === appointment.id;
                    const canAcceptOrReject = appointment.status === 'PENDING';
                    const canComplete = appointment.status === 'CONFIRMED';

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
                                Patient #{appointment.patientId}
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
                              disabled={!canAcceptOrReject || isBusy}
                              onClick={() => void handleAction(appointment.id, acceptAppointment)}
                              className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isBusy && canAcceptOrReject ? 'Working...' : 'Accept'}
                            </button>
                            <button
                              type="button"
                              disabled={!canAcceptOrReject || isBusy}
                              onClick={() => void handleAction(appointment.id, rejectAppointment)}
                              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              disabled={!canComplete || isBusy}
                              onClick={() => void handleAction(appointment.id, completeAppointment)}
                              className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Complete
                            </button>
                          </div>
                        </div>
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
