import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Loader2, MapPin, Video } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import { patientApi } from '../services/patientApi';
import {
  acceptAppointmentWithFee,
  completeAppointment,
  getMyDoctorAppointments,
  rejectAppointment,
  type AppointmentResponse,
} from '../services/appointmentsApi';
import { getAuthUser } from '../services/authSession';
import {
  getMyDoctorTelemedicineSessions,
  type TelemedicineSessionResponse,
} from '../services/telemedicineApi';
import type { PatientProfile } from '../types/patient';
import { formatDisplayAmount } from '../utils/currency';
import { getConsultationAccessState } from '../utils/telemedicine/telemedicineFlow';
import PrescriptionForm from '../components/doctor/PrescriptionForm';

const VIDEO_FIXED_FEE = 15;
const PHYSICAL_FIXED_FEE = 20;
const EXTRA_FEE_CAP_MULTIPLIER = 2;

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

function formatMoney(amount?: number | null, currency = 'USD') {
  if (amount == null || Number.isNaN(amount)) {
    return formatDisplayAmount(0, currency);
  }
  return formatDisplayAmount(amount, currency);
}

function getStatusBadgeClasses(status: AppointmentResponse['status']) {
  if (status === 'CONFIRMED') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'PENDING') {
    return 'bg-amber-100 text-amber-700';
  }

  if (status === 'EXPIRED') {
    return 'bg-slate-200 text-slate-700';
  }

  if (status === 'COMPLETED') {
    return 'bg-blue-100 text-blue-700';
  }

  if (status === 'CANCELLED') {
    return 'bg-red-100 text-red-700';
  }

  return 'bg-gray-100 text-gray-700';
}

function resolveBaseFee(appointment: AppointmentResponse) {
  if (
    appointment.fixedFeeSnapshot != null &&
    Number.isFinite(appointment.fixedFeeSnapshot) &&
    appointment.fixedFeeSnapshot > 0
  ) {
    return appointment.fixedFeeSnapshot;
  }

  return appointment.appointmentType === 'VIDEO' ? VIDEO_FIXED_FEE : PHYSICAL_FIXED_FEE;
}

type AppointmentGroup = {
  title: string;
  description: string;
  appointments: AppointmentResponse[];
};

type PendingConfirmation = {
  title: string;
  message: string;
  confirmLabel: string;
  tone: 'primary' | 'danger' | 'success';
  details?: ReactNode;
  action: () => Promise<void>;
} | null;

function buildAppointmentSummary(appointment: AppointmentResponse) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <p className="font-semibold text-slate-900">Patient #{appointment.patientId}</p>
      <p className="mt-1">
        {formatDateLabel(appointment.appointmentDate)} at {formatTimeLabel(appointment.startTime)} -{' '}
        {formatTimeLabel(appointment.endTime)}
      </p>
      <p className="mt-1">
        {appointment.appointmentType === 'VIDEO' ? 'Video Consultation' : 'In-Person Visit'}
      </p>
    </div>
  );
}

function getPatientDisplayName(profile: PatientProfile | null | undefined, patientId: number) {
  const fullName = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim();
  return fullName || `Patient #${patientId}`;
}

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [telemedicineMap, setTelemedicineMap] = useState<Record<number, TelemedicineSessionResponse>>({});
  const [patientMap, setPatientMap] = useState<Record<number, PatientProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [acceptModalAppointment, setAcceptModalAppointment] = useState<AppointmentResponse | null>(null);
  const [acceptExtraFee, setAcceptExtraFee] = useState('0');
  const [acceptExtraFeeReason, setAcceptExtraFeeReason] = useState('');
  const [acceptFormError, setAcceptFormError] = useState('');
  const [prescriptionModalAppointment, setPrescriptionModalAppointment] = useState<AppointmentResponse | null>(null);
  const [confirmation, setConfirmation] = useState<PendingConfirmation>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const acceptFeeInputRef = useRef<HTMLInputElement | null>(null);

  const loadAppointments = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    setError('');

    try {
      const response = await getMyDoctorAppointments();
      setAppointments(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load doctor appointments');
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      void loadAppointments(true);
    }, 30000);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [loadAppointments]);

  useEffect(() => {
    const authUser = getAuthUser();
    const doctorProfileId = localStorage.getItem('doctorProfileId');
    const doctorId = doctorProfileId || (authUser?.id ? String(authUser.id) : null);

    if (!doctorId) {
      setTelemedicineMap({});
      return;
    }

    let isActive = true;

    const loadTelemedicineSessions = async () => {
      try {
        const sessions = await getMyDoctorTelemedicineSessions(doctorId);
        if (!isActive) {
          return;
        }

        setTelemedicineMap(
          sessions.reduce<Record<number, TelemedicineSessionResponse>>((acc, session) => {
            acc[session.appointmentId] = session;
            return acc;
          }, {}),
        );
      } catch {
        if (isActive) {
          setTelemedicineMap({});
        }
      }
    };

    void loadTelemedicineSessions();

    return () => {
      isActive = false;
    };
  }, [appointments]);

  const groupedAppointments = useMemo<AppointmentGroup[]>(() => {
    const pending = appointments.filter((appointment) => appointment.status === 'PENDING');
    const confirmed = appointments.filter((appointment) => appointment.status === 'CONFIRMED');
    const history = appointments.filter(
      (appointment) =>
        appointment.status !== 'PENDING' &&
        appointment.status !== 'CONFIRMED',
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
        title: 'History / Other Records',
        description: 'Completed, rejected, cancelled, and expired appointment records.',
        appointments: history,
      },
    ];
  }, [appointments]);

  const patientIds = useMemo(
    () => [...new Set(appointments.map((appointment) => appointment.patientId))],
    [appointments],
  );

  useEffect(() => {
    const missingPatientIds = patientIds.filter((patientId) => !patientMap[patientId]);

    if (!missingPatientIds.length) {
      return;
    }

    let isActive = true;

    const loadPatients = async () => {
      const patientEntries = await Promise.all(
        missingPatientIds.map(async (patientId) => {
          try {
            const response = await patientApi.getPatientProfileForDoctor(patientId);
            return [patientId, response.data] as const;
          } catch {
            return null;
          }
        }),
      );

      if (!isActive) {
        return;
      }

      setPatientMap((currentMap) => {
        const nextMap = { ...currentMap };

        patientEntries.forEach((entry) => {
          if (!entry) {
            return;
          }

          const [patientId, patient] = entry;
          nextMap[patientId] = patient;
        });

        return nextMap;
      });
    };

    void loadPatients();

    return () => {
      isActive = false;
    };
  }, [patientIds, patientMap]);

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

  const closeConfirmation = () => {
    if (isConfirming) {
      return;
    }

    setConfirmation(null);
  };

  const handleConfirm = async () => {
    if (!confirmation) {
      return;
    }

    setIsConfirming(true);

    try {
      await confirmation.action();
      setConfirmation(null);
    } finally {
      setIsConfirming(false);
    }
  };

  const openAcceptModal = (appointment: AppointmentResponse) => {
    setAcceptModalAppointment(appointment);
    setAcceptExtraFee((appointment.doctorExtraFee ?? 0).toString());
    setAcceptExtraFeeReason(appointment.extraFeeReason ?? '');
    setAcceptFormError('');
  };

  const closeAcceptModal = () => {
    setAcceptModalAppointment(null);
    setAcceptExtraFee('0');
    setAcceptExtraFeeReason('');
    setAcceptFormError('');
  };

  useEffect(() => {
    if (!acceptModalAppointment) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAcceptModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const focusTimer = window.setTimeout(() => {
      acceptFeeInputRef.current?.focus();
      acceptFeeInputRef.current?.select();
    }, 0);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [acceptModalAppointment]);

  const handleAcceptSubmit = async () => {
    if (!acceptModalAppointment) {
      return;
    }

    const parsedExtraFee = Number(acceptExtraFee.trim() || '0');
    if (!Number.isFinite(parsedExtraFee) || parsedExtraFee < 0) {
      setAcceptFormError('Extra fee must be a valid non-negative number');
      return;
    }

    const baseFee = resolveBaseFee(acceptModalAppointment);
    const maxExtraFee = Number((baseFee * EXTRA_FEE_CAP_MULTIPLIER).toFixed(2));
    if (parsedExtraFee > maxExtraFee) {
      setAcceptFormError(
        `Extra fee cannot exceed ${formatMoney(maxExtraFee, acceptModalAppointment.feeCurrency || 'USD')}`,
      );
      return;
    }

    const normalizedReason = acceptExtraFeeReason.trim();
    if (parsedExtraFee > 0 && !normalizedReason) {
      setAcceptFormError('Reason is required when adding an extra fee');
      return;
    }

    setActionLoadingId(acceptModalAppointment.id);
    setError('');
    setAcceptFormError('');
    try {
      await acceptAppointmentWithFee(acceptModalAppointment.id, {
        extraFee: parsedExtraFee,
        extraFeeReason: normalizedReason,
      });
      closeAcceptModal();
      await loadAppointments();
    } catch (actionError) {
      setAcceptFormError(
        actionError instanceof Error ? actionError.message : 'Failed to accept appointment',
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

                {group.title === 'Confirmed Appointments' ? (
                  <div className="overflow-hidden rounded-2xl border border-gray-200/40 bg-white shadow-lg">
                    {group.appointments.length === 0 ? (
                      <div className="p-5 text-sm text-gray-500">No appointments in this section yet.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-slate-50">
                            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <th className="px-4 py-3">Patient</th>
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">Time</th>
                              <th className="px-4 py-3">Type</th>
                              <th className="px-4 py-3">Payment</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {group.appointments.map((appointment) => {
                              const isBusy = actionLoadingId === appointment.id;
                              const patient = patientMap[appointment.patientId];
                              const patientName = getPatientDisplayName(patient, appointment.patientId);
                              const canComplete = appointment.status === 'CONFIRMED';
                              const paymentStatus = (appointment.paymentStatusHint || 'UNPAID').toUpperCase();
                              const isPaymentSettled =
                                paymentStatus === 'PAID' || paymentStatus === 'COMPLETED';
                              const paymentAmount =
                                appointment.finalFee ?? appointment.fixedFeeSnapshot ?? appointment.doctorExtraFee ?? null;
                              const paymentCurrency = appointment.feeCurrency || 'USD';
                              const telemedicineSession = telemedicineMap[appointment.id];
                              const consultationState =
                                appointment.appointmentType === 'VIDEO'
                                  ? getConsultationAccessState(appointment, telemedicineSession, 'DOCTOR')
                                  : null;
                              const showConsultationLink =
                                appointment.appointmentType === 'VIDEO' &&
                                appointment.status !== 'PENDING' &&
                                consultationState?.canOpenPage;
                              const showPhysicalComplete =
                                appointment.appointmentType !== 'VIDEO' && canComplete;

                              return (
                                <tr key={appointment.id} className="align-top text-sm text-slate-700">
                                  <td className="px-4 py-4">
                                    <div className="font-semibold text-slate-900">{patientName}</div>
                                    <div className="mt-1 text-xs text-slate-500">
                                      Patient ID: {appointment.patientId}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">Appointment #{appointment.id}</div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">{formatDateLabel(appointment.appointmentDate)}</td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    {formatTimeLabel(appointment.startTime)} - {formatTimeLabel(appointment.endTime)}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    {appointment.appointmentType === 'VIDEO' ? 'Video Consultation' : 'In-Person Visit'}
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="font-semibold text-slate-900">
                                      {paymentAmount != null ? formatMoney(paymentAmount, paymentCurrency) : 'TBD'}
                                    </div>
                                    <div
                                      className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                        isPaymentSettled ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                                      }`}
                                    >
                                      {isPaymentSettled ? 'PAID' : 'UNPAID'}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span
                                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClasses(appointment.status)}`}
                                    >
                                      {appointment.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="flex flex-wrap gap-2">
                                      {showConsultationLink && (
                                        <Link
                                          to={`/consultation/${encodeURIComponent(String(appointment.id))}`}
                                          className="inline-flex items-center justify-center rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-700"
                                        >
                                          {consultationState?.primaryLabel || 'Open'}
                                        </Link>
                                      )}
                                      {showPhysicalComplete && (
                                        <button
                                          type="button"
                                          disabled={isBusy || !isPaymentSettled}
                                          onClick={() =>
                                            setConfirmation({
                                              title: 'Complete Appointment',
                                              message:
                                                'This will mark the consultation as completed using the current doctor workflow.',
                                              confirmLabel: 'Confirm Completion',
                                              tone: 'success',
                                              details: buildAppointmentSummary(appointment),
                                              action: async () => {
                                                await handleAction(appointment.id, completeAppointment);
                                              },
                                            })
                                          }
                                          className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                          Complete
                                        </button>
                                      )}
                                      {(canComplete || appointment.status === 'COMPLETED') && (
                                        <button
                                          type="button"
                                          onClick={() => setPrescriptionModalAppointment(appointment)}
                                          className="rounded-lg px-3 py-2 text-xs font-semibold text-white bg-indigo-600 transition hover:bg-indigo-700"
                                        >
                                          Write Prescription
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {group.appointments.length === 0 && (
                      <div className="rounded-2xl border border-gray-200/40 bg-white p-5 text-sm text-gray-500 shadow-lg">
                        No appointments in this section yet.
                      </div>
                    )}

                    {group.appointments.map((appointment) => {
                      const isBusy = actionLoadingId === appointment.id;
                      const patient = patientMap[appointment.patientId];
                      const patientName = getPatientDisplayName(patient, appointment.patientId);
                      const canAcceptOrReject = appointment.status === 'PENDING';
                      const canComplete = appointment.status === 'CONFIRMED';
                      const paymentStatus = (appointment.paymentStatusHint || 'UNPAID').toUpperCase();
                      const isPaymentSettled =
                        paymentStatus === 'PAID' || paymentStatus === 'COMPLETED';
                      const paymentAmount =
                        appointment.finalFee ?? appointment.fixedFeeSnapshot ?? appointment.doctorExtraFee ?? null;
                      const paymentCurrency = appointment.feeCurrency || 'USD';
                      const telemedicineSession = telemedicineMap[appointment.id];
                      const consultationState =
                        appointment.appointmentType === 'VIDEO'
                          ? getConsultationAccessState(appointment, telemedicineSession, 'DOCTOR')
                          : null;
                      const showConsultationLink =
                        appointment.appointmentType === 'VIDEO' &&
                        appointment.status !== 'PENDING' &&
                        consultationState?.canOpenPage;
                      const showPhysicalComplete =
                        appointment.appointmentType !== 'VIDEO' && canComplete;

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
                                  {patientName}
                                </h3>
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(appointment.status)}`}
                                >
                                  {appointment.status}
                                </span>
                              </div>
                              <p className="mb-3 text-sm text-slate-500">Patient ID: {appointment.patientId}</p>

                              <div
                                className={`mb-4 rounded-2xl border px-4 py-4 ${
                                  isPaymentSettled
                                    ? 'border-emerald-200 bg-emerald-50'
                                    : 'border-orange-200 bg-orange-50'
                                }`}
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                      isPaymentSettled
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-orange-100 text-orange-700'
                                    }`}
                                  >
                                    {isPaymentSettled ? 'PAID' : 'UNPAID'}
                                  </span>
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                    {appointment.status === 'CONFIRMED'
                                      ? 'Ready for consultation'
                                      : 'Awaiting doctor decision'}
                                  </span>
                                </div>

                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                      Amount
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-slate-900">
                                      {paymentAmount != null
                                        ? formatMoney(paymentAmount, paymentCurrency)
                                        : 'TBD'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                      Payment note
                                    </p>
                                    <p className="mt-1 text-sm text-slate-700">
                                      {isPaymentSettled
                                        ? 'Payment has been confirmed for this appointment.'
                                        : appointment.status === 'CONFIRMED'
                                          ? 'Collect payment before starting the consultation.'
                                          : 'Payment will appear after you accept the appointment.'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {appointment.doctorExtraFee != null && appointment.doctorExtraFee > 0 && (
                                <p className="text-xs text-orange-700">
                                  Includes extra fee {formatMoney(appointment.doctorExtraFee, appointment.feeCurrency || 'USD')}
                                  {appointment.extraFeeReason ? ` (${appointment.extraFeeReason})` : ''}
                                </p>
                              )}

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

                              {appointment.statusReason && (
                                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                  {appointment.statusReason}
                                </div>
                              )}

                              {consultationState && (
                                <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-4">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                                        Consultation Flow
                                      </p>
                                      <h4 className="mt-1 text-sm font-bold text-slate-900">
                                        {consultationState.primaryLabel}
                                      </h4>
                                      <p className="mt-1 text-sm text-slate-700">{consultationState.message}</p>
                                      {telemedicineSession?.consultationSummary && (
                                        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
                                          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                            Recorded Summary
                                          </p>
                                          <p className="mt-1">{telemedicineSession.consultationSummary}</p>
                                        </div>
                                      )}
                                    </div>

                                    {showConsultationLink && (
                                      <Link
                                        to={`/consultation/${encodeURIComponent(String(appointment.id))}`}
                                        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
                                      >
                                        {consultationState.primaryLabel}
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                              <button
                                type="button"
                                disabled={!canAcceptOrReject || isBusy}
                                onClick={() => openAcceptModal(appointment)}
                                className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isBusy && canAcceptOrReject ? 'Working...' : 'Accept'}
                              </button>
                              <button
                                type="button"
                                disabled={!canAcceptOrReject || isBusy}
                                onClick={() =>
                                  setConfirmation({
                                    title: 'Reject Appointment',
                                    message:
                                      'This will decline the pending request while preserving the existing appointment record.',
                                    confirmLabel: 'Confirm Rejection',
                                    tone: 'danger',
                                    details: buildAppointmentSummary(appointment),
                                    action: async () => {
                                      await handleAction(appointment.id, rejectAppointment);
                                    },
                                  })
                                }
                                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Reject
                              </button>
                              {showPhysicalComplete && (
                                <button
                                  type="button"
                                  disabled={isBusy || !isPaymentSettled}
                                  onClick={() =>
                                    setConfirmation({
                                      title: 'Complete Appointment',
                                      message:
                                        'This will mark the consultation as completed using the current doctor workflow.',
                                      confirmLabel: 'Confirm Completion',
                                      tone: 'success',
                                      details: buildAppointmentSummary(appointment),
                                      action: async () => {
                                        await handleAction(appointment.id, completeAppointment);
                                      },
                                    })
                                  }
                                  className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Complete
                                </button>
                              )}
                              {(canComplete || appointment.status === 'COMPLETED') && (
                                <button
                                  type="button"
                                  onClick={() => setPrescriptionModalAppointment(appointment)}
                                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-indigo-600 transition hover:bg-indigo-700"
                                >
                                  Write Prescription
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>

      {acceptModalAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">Accept Appointment</h3>
            <p className="mt-1 text-sm text-slate-600">
              Set an optional extra fee before confirming this appointment.
            </p>

            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              {(() => {
                const baseFee = resolveBaseFee(acceptModalAppointment);
                const maxExtraFee = Number((baseFee * EXTRA_FEE_CAP_MULTIPLIER).toFixed(2));
                const currency = acceptModalAppointment.feeCurrency || 'USD';
                return (
                  <>
                    <p>Base fee: {formatMoney(baseFee, currency)}</p>
                    <p>Max allowed extra fee: {formatMoney(maxExtraFee, currency)}</p>
                  </>
                );
              })()}
            </div>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Extra Fee (optional)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={acceptExtraFee}
                  ref={acceptFeeInputRef}
                  onChange={(event) => setAcceptExtraFee(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="0.00"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Extra Fee Reason {Number(acceptExtraFee || '0') > 0 ? '(required)' : '(optional)'}
                </span>
                <textarea
                  rows={3}
                  value={acceptExtraFeeReason}
                  onChange={(event) => setAcceptExtraFeeReason(event.target.value)}
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Explain why this extra fee is needed"
                />
              </label>
            </div>

            {acceptFormError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {acceptFormError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeAcceptModal}
                disabled={actionLoadingId === acceptModalAppointment.id}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAcceptSubmit()}
                disabled={actionLoadingId === acceptModalAppointment.id}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoadingId === acceptModalAppointment.id ? 'Accepting...' : 'Confirm Accept'}
              </button>
            </div>
          </div>
        </div>
      )}

      {prescriptionModalAppointment && (
        <div className="fixed inset-0 z-[60] overflow-y-auto flex p-4 sm:p-8 justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setPrescriptionModalAppointment(null)}
          />
          <div className="relative z-10 w-full h-max mt-4 sm:mt-10 pb-20 flex justify-center">
            <PrescriptionForm
              patientId={prescriptionModalAppointment.patientId}
              appointmentId={prescriptionModalAppointment.id}
              onCreated={() => {
                setPrescriptionModalAppointment(null);
                void loadAppointments();
              }}
              onCancel={() => setPrescriptionModalAppointment(null)}
            />
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={Boolean(confirmation)}
        title={confirmation?.title || ''}
        message={confirmation?.message || ''}
        confirmLabel={confirmation?.confirmLabel || 'Confirm'}
        tone={confirmation?.tone || 'primary'}
        details={confirmation?.details}
        isLoading={isConfirming}
        onClose={closeConfirmation}
        onConfirm={handleConfirm}
      />
    </div>
  );
}