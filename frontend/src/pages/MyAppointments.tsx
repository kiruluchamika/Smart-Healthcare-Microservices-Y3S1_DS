import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  RefreshCw,
  Video,
  X,
} from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import {
  createCheckoutSession,
  getMyPayments,
  type PaymentResponse,
} from '../services/paymentApi';
import {
  cancelAppointment,
  getDoctorAvailability,
  getMyAppointments,
  rescheduleAppointment,
  type AppointmentResponse,
  type GeneratedAvailabilitySlot,
} from '../services/appointmentsApi';
import { getDoctorById } from '../services/doctor/doctorApi';
import { getAuthUser } from '../services/authSession';
import {
  getMyPatientTelemedicineSessions,
  type TelemedicineSessionResponse,
} from '../services/telemedicineApi';
import type { DoctorServiceDoctor } from '../types/doctor';
import {
  getDoctorFullName,
  getPrimaryClinicLocation,
} from '../utils/doctor/doctorFormatters';
import { formatDisplayAmount } from '../utils/currency';
import { getConsultationAccessState } from '../utils/telemedicine/telemedicineFlow';

const DISMISSED_CANCELLED_STORAGE_KEY = 'smarthealth.dismissedCancelledAppointments';
const DISMISSED_REJECTED_STORAGE_KEY = 'smarthealth.dismissedRejectedAppointments';

type AppointmentFilter =
  | 'ALL'
  | 'UPCOMING'
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'HISTORY';

type PendingConfirmation = {
  title: string;
  message: string;
  confirmLabel: string;
  tone: 'primary' | 'danger' | 'success';
  details?: ReactNode;
  action: () => Promise<void>;
} | null;

type FilterOption = {
  value: AppointmentFilter;
  label: string;
  description: string;
};

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

function getAppointmentEnd(appointment: AppointmentResponse) {
  return new Date(`${appointment.appointmentDate}T${appointment.endTime}`);
}

function isUpcomingAppointment(appointment: AppointmentResponse) {
  if (appointment.status !== 'PENDING' && appointment.status !== 'CONFIRMED') {
    return false;
  }

  return getAppointmentEnd(appointment) >= new Date();
}

function isHistoryAppointment(appointment: AppointmentResponse) {
  if (
    appointment.status === 'COMPLETED' ||
    appointment.status === 'CANCELLED' ||
    appointment.status === 'REJECTED' ||
    appointment.status === 'EXPIRED'
  ) {
    return true;
  }

  return getAppointmentEnd(appointment) < new Date();
}

function isAppointmentPaid(
  appointment: Pick<AppointmentResponse, 'paymentStatusHint'>,
  payment: Pick<PaymentResponse, 'status'> | null | undefined,
) {
  const paymentHint = (appointment.paymentStatusHint || '').toUpperCase();
  const isPaidByHint = paymentHint === 'PAID' || paymentHint === 'COMPLETED';
  const isPaidByRecord = payment?.status === 'PAID' || payment?.status === 'COMPLETED';

  return isPaidByHint || isPaidByRecord;
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

  if (status === 'REJECTED') {
    return 'bg-rose-100 text-rose-700';
  }

  return 'bg-gray-100 text-gray-700';
}

function readDismissedIds(storageKey: string) {
  if (typeof window === 'undefined') {
    return [] as number[];
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey);
    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);
  } catch {
    return [];
  }
}

function writeDismissedIds(storageKey: string, ids: number[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(ids));
}

function buildAppointmentSummary(
  appointment: AppointmentResponse,
  doctor: DoctorServiceDoctor | null,
) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <p className="font-semibold text-slate-900">
        {doctor ? getDoctorFullName(doctor) : `Doctor #${appointment.doctorId}`}
      </p>
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

export default function MyAppointments() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [paymentMap, setPaymentMap] = useState<Record<number, PaymentResponse>>({});
  const [doctorMap, setDoctorMap] = useState<Record<number, DoctorServiceDoctor>>({});
  const [telemedicineMap, setTelemedicineMap] = useState<Record<number, TelemedicineSessionResponse>>({});
  const [dismissedCancelledIds, setDismissedCancelledIds] = useState<number[]>(() =>
    readDismissedIds(DISMISSED_CANCELLED_STORAGE_KEY),
  );
  const [dismissedRejectedIds, setDismissedRejectedIds] = useState<number[]>(() =>
    readDismissedIds(DISMISSED_REJECTED_STORAGE_KEY),
  );
  const [activeFilter, setActiveFilter] = useState<AppointmentFilter>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeRescheduleId, setActiveRescheduleId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState<GeneratedAvailabilitySlot | null>(null);
  const [rescheduleSlots, setRescheduleSlots] = useState<GeneratedAvailabilitySlot[]>([]);
  const [rescheduleError, setRescheduleError] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [paymentLoadingId, setPaymentLoadingId] = useState<number | null>(null);
  const [confirmation, setConfirmation] = useState<PendingConfirmation>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const dateOptions = useMemo(() => getNextSevenDates(), []);
  const doctorIds = useMemo(
    () => [...new Set(appointments.map((appointment) => appointment.doctorId))],
    [appointments],
  );

  const filterOptions = useMemo<FilterOption[]>(
    () => [
      {
        value: 'ALL',
        label: 'All',
        description: 'Everything except cancelled cards you have removed from the current view.',
      },
      {
        value: 'UPCOMING',
        label: 'Upcoming',
        description: 'Active future appointments that still need your attention.',
      },
      {
        value: 'PENDING',
        label: 'Pending',
        description: 'Appointment requests waiting for doctor confirmation.',
      },
      {
        value: 'CONFIRMED',
        label: 'Confirmed',
        description: 'Appointments approved by the doctor.',
      },
      {
        value: 'CANCELLED',
        label: 'Cancelled',
        description: 'Cancelled appointments that remain visible in your current list.',
      },
      {
        value: 'REJECTED',
        label: 'Rejected',
        description: 'Requests the doctor declined so you can quickly rebook.',
      },
      {
        value: 'COMPLETED',
        label: 'Completed',
        description: 'Appointments that finished successfully.',
      },
      {
        value: 'HISTORY',
        label: 'History',
        description: 'Past, completed, cancelled, rejected, and expired appointment records.',
      },
    ],
    [],
  );

  const loadAppointments = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    setError('');

    try {
      const appointmentResponse = await getMyAppointments();
      setAppointments(appointmentResponse);

      try {
        const paymentsResponse = await getMyPayments();
        const safePayments = Array.isArray(paymentsResponse) ? paymentsResponse : [];
        setPaymentMap(
          safePayments.reduce<Record<number, PaymentResponse>>((acc, payment) => {
            acc[payment.appointmentId] = payment;
            return acc;
          }, {}),
        );
      } catch {
        setPaymentMap({});
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load appointments');
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
    if (!authUser?.id) {
      setTelemedicineMap({});
      return;
    }

    let isActive = true;

    const loadTelemedicineSessions = async () => {
      try {
        const sessions = await getMyPatientTelemedicineSessions(authUser.id);
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

  useEffect(() => {
    const refreshPaymentFor = searchParams.get('refreshPaymentFor');
    if (!refreshPaymentFor) {
      return;
    }

    void loadAppointments(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('refreshPaymentFor');
    setSearchParams(nextParams, { replace: true });
  }, [loadAppointments, searchParams, setSearchParams]);

  useEffect(() => {
    const missingDoctorIds = doctorIds.filter((doctorId) => !doctorMap[doctorId]);

    if (!missingDoctorIds.length) {
      return;
    }

    let isActive = true;

    const loadDoctors = async () => {
      const doctorEntries = await Promise.all(
        missingDoctorIds.map(async (doctorId) => {
          try {
            const doctor = await getDoctorById(doctorId);
            return [doctorId, doctor] as const;
          } catch {
            return null;
          }
        }),
      );

      if (!isActive) {
        return;
      }

      setDoctorMap((currentMap) => {
        const nextMap = { ...currentMap };

        doctorEntries.forEach((entry) => {
          if (!entry) {
            return;
          }

          const [doctorId, doctor] = entry;
          nextMap[doctorId] = doctor;
        });

        return nextMap;
      });
    };

    void loadDoctors();

    return () => {
      isActive = false;
    };
  }, [doctorIds, doctorMap]);

  const getDoctorDetails = (doctorId: number) => doctorMap[doctorId] || null;

  const openReschedule = (appointment: AppointmentResponse) => {
    setActiveRescheduleId(appointment.id);
    setRescheduleDate(appointment.appointmentDate);
    setRescheduleSlot(null);
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
        const availableSlots = (response.slots || []).filter(
          (slot) =>
            slot.state === 'AVAILABLE' ||
            (slot.appointmentId === appointment.id &&
              slot.startTime === appointment.startTime &&
              slot.endTime === appointment.endTime),
        );

        if (isActive) {
          setRescheduleSlots(availableSlots);
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
  }, [activeRescheduleId, appointments, rescheduleDate]);

  const filteredAppointments = useMemo(() => {
    const dismissedCancelled = new Set(dismissedCancelledIds);

    return appointments.filter((appointment) => {
      const isDismissedCancelled =
        appointment.status === 'CANCELLED' && dismissedCancelled.has(appointment.id);
      const isDismissedRejected =
        appointment.status === 'REJECTED' && dismissedRejectedIds.includes(appointment.id);

      if (isDismissedCancelled && activeFilter !== 'HISTORY') {
        return false;
      }

      if (isDismissedRejected && activeFilter !== 'HISTORY') {
        return false;
      }

      if (activeFilter === 'ALL') {
        return true;
      }

      if (activeFilter === 'UPCOMING') {
        return isUpcomingAppointment(appointment);
      }

      if (activeFilter === 'HISTORY') {
        return isHistoryAppointment(appointment);
      }

      return appointment.status === activeFilter;
    });
  }, [activeFilter, appointments, dismissedCancelledIds, dismissedRejectedIds]);

  const filterCounts = useMemo(() => {
    const counts = {
      ALL: 0,
      UPCOMING: 0,
      PENDING: 0,
      CONFIRMED: 0,
      CANCELLED: 0,
      REJECTED: 0,
      COMPLETED: 0,
      HISTORY: 0,
    } satisfies Record<AppointmentFilter, number>;

    const dismissedCancelled = new Set(dismissedCancelledIds);
    const dismissedRejected = new Set(dismissedRejectedIds);

    appointments.forEach((appointment) => {
      const isDismissedCancelled =
        appointment.status === 'CANCELLED' && dismissedCancelled.has(appointment.id);

      if (!isDismissedCancelled) {
        counts.ALL += 1;
      }

      if (isUpcomingAppointment(appointment)) {
        counts.UPCOMING += 1;
      }

      if (appointment.status === 'PENDING') {
        counts.PENDING += 1;
      }

      if (appointment.status === 'CONFIRMED') {
        counts.CONFIRMED += 1;
      }

      if (appointment.status === 'CANCELLED' && !isDismissedCancelled) {
        counts.CANCELLED += 1;
      }

      if (appointment.status === 'REJECTED') {
        if (!dismissedRejected.has(appointment.id)) {
          counts.REJECTED += 1;
        }
      }

      if (appointment.status === 'COMPLETED') {
        counts.COMPLETED += 1;
      }

      if (isHistoryAppointment(appointment)) {
        counts.HISTORY += 1;
      }
    });

    return counts;
  }, [appointments, dismissedCancelledIds, dismissedRejectedIds]);

  const activeFilterMeta = useMemo(
    () => filterOptions.find((option) => option.value === activeFilter) || filterOptions[0],
    [activeFilter, filterOptions],
  );
  const upcomingPaymentDueAppointments = useMemo(
    () =>
      filteredAppointments.filter(
        (appointment) => !isAppointmentPaid(appointment, paymentMap[appointment.id]),
      ),
    [filteredAppointments, paymentMap],
  );
  const upcomingPaidAppointments = useMemo(
    () =>
      filteredAppointments.filter((appointment) =>
        isAppointmentPaid(appointment, paymentMap[appointment.id]),
      ),
    [filteredAppointments, paymentMap],
  );

  const hiddenCancelledCount = dismissedCancelledIds.filter((id) =>
    appointments.some((appointment) => appointment.id === id && appointment.status === 'CANCELLED'),
  ).length;
  const hiddenRejectedCount = dismissedRejectedIds.filter((id) =>
    appointments.some((appointment) => appointment.id === id && appointment.status === 'REJECTED'),
  ).length;

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
    if (!rescheduleDate || !rescheduleSlot) {
      setRescheduleError('Please select a new date and time');
      return;
    }

    setActionLoadingId(appointment.id);
    setRescheduleError('');

    try {
      await rescheduleAppointment(appointment.id, {
        appointmentDate: rescheduleDate,
        startTime: rescheduleSlot.startTime,
        endTime: rescheduleSlot.endTime,
      });
      setActiveRescheduleId(null);
      setRescheduleSlot(null);
      setRescheduleSlots([]);
      await loadAppointments();
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : 'Failed to reschedule appointment';
      setRescheduleError(message);

      if (message.includes('slot is no longer available')) {
        try {
          const response = await getDoctorAvailability(appointment.doctorId, rescheduleDate);
          setRescheduleSlots((response.slots || []).filter((slot) => slot.state === 'AVAILABLE'));
          setRescheduleSlot(null);
        } catch {
          // Keep the original reschedule error visible if the refresh fails.
        }
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePayNow = async (appointment: AppointmentResponse) => {
    setPaymentLoadingId(appointment.id);
    setError('');

    try {
      const origin = window.location.origin;
      const response = await createCheckoutSession({
        appointmentId: appointment.id,
        successUrl: `${origin}/payments/success?appointmentId=${appointment.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/payments/cancel?appointmentId=${appointment.id}`,
      });

      if (!response.checkoutUrl) {
        throw new Error('Checkout URL is unavailable. Please try again.');
      }

      window.location.assign(response.checkoutUrl);
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : 'Failed to start payment flow');
    } finally {
      setPaymentLoadingId(null);
    }
  };

  const dismissCancelledAppointment = async (appointmentId: number) => {
    setDismissedCancelledIds((currentIds) => {
      const nextIds = currentIds.includes(appointmentId) ? currentIds : [...currentIds, appointmentId];
      writeDismissedIds(DISMISSED_CANCELLED_STORAGE_KEY, nextIds);
      return nextIds;
    });

    if (activeFilter === 'CANCELLED' && filteredAppointments.length === 1) {
      setActiveFilter('ALL');
    }
  };

  const restoreDismissedCancelledAppointments = () => {
    setDismissedCancelledIds([]);
    writeDismissedIds(DISMISSED_CANCELLED_STORAGE_KEY, []);
  };

  const dismissRejectedAppointment = async (appointmentId: number) => {
    setDismissedRejectedIds((currentIds) => {
      const nextIds = currentIds.includes(appointmentId) ? currentIds : [...currentIds, appointmentId];
      writeDismissedIds(DISMISSED_REJECTED_STORAGE_KEY, nextIds);
      return nextIds;
    });

    if (activeFilter === 'REJECTED' && filteredAppointments.length === 1) {
      setActiveFilter('ALL');
    }
  };

  const restoreDismissedRejectedAppointments = () => {
    setDismissedRejectedIds([]);
    writeDismissedIds(DISMISSED_REJECTED_STORAGE_KEY, []);
  };

  const goToBookingPage = (appointment: AppointmentResponse) => {
    const params = new URLSearchParams({
      doctorId: String(appointment.doctorId),
      appointmentType: appointment.appointmentType,
      reason: appointment.reasonForVisit,
      sourceAppointmentId: String(appointment.id),
    });

    navigate(`/appointments/book?${params.toString()}`);
  };

  const renderAppointmentCard = (appointment: AppointmentResponse) => {
    const doctor = getDoctorDetails(appointment.doctorId);
    const canCancel = appointment.status === 'PENDING' || appointment.status === 'CONFIRMED';
    const canReschedule = appointment.status === 'PENDING' || appointment.status === 'CONFIRMED';
    const isRescheduling = activeRescheduleId === appointment.id;
    const isBusy = actionLoadingId === appointment.id;
    const isPaying = paymentLoadingId === appointment.id;
    const payment = paymentMap[appointment.id];
    const isPaid = isAppointmentPaid(appointment, payment);
    const paymentFailed = payment?.status === 'FAILED';
    const checkoutCreated = payment?.status === 'CHECKOUT_CREATED';
    const canPayNow = appointment.status === 'CONFIRMED' && !isPaid;
    const amountDue = appointment.finalFee ?? (payment?.amount ? Number(payment.amount) : null);
    const amountCurrency = appointment.feeCurrency || payment?.currency || 'USD';
    const paymentStateLabel = isPaid
      ? 'PAID'
      : appointment.status === 'CONFIRMED'
        ? 'PAYMENT DUE'
        : 'NOT AVAILABLE YET';
    const telemedicineSession = telemedicineMap[appointment.id];
    const consultationState =
      appointment.appointmentType === 'VIDEO'
        ? getConsultationAccessState(appointment, telemedicineSession, 'PATIENT')
        : null;
    const summaryCard = buildAppointmentSummary(appointment, doctor);

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
                {doctor ? getDoctorFullName(doctor) : `Doctor #${appointment.doctorId}`}
              </h3>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(appointment.status)}`}
              >
                {appointment.status}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isPaid
                    ? 'bg-emerald-100 text-emerald-700'
                    : appointment.status === 'CONFIRMED'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-slate-100 text-slate-700'
                }`}
              >
                {paymentStateLabel}
              </span>
              {appointment.status === 'CANCELLED' &&
                dismissedCancelledIds.includes(appointment.id) &&
                activeFilter === 'HISTORY' && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    Removed From Current View
                  </span>
                )}
              {appointment.status === 'REJECTED' &&
                dismissedRejectedIds.includes(appointment.id) &&
                activeFilter === 'HISTORY' && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    Closed From Current View
                  </span>
                )}
            </div>

            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Amount to Pay
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {amountDue != null ? formatDisplayAmount(amountDue, amountCurrency) : 'TBD'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {isPaid
                  ? 'This appointment has been paid successfully.'
                  : appointment.status === 'CONFIRMED'
                    ? 'Payment is now required before consultation.'
                    : 'Payment will appear after doctor approval.'}
              </p>
            </div>

            <p className="mb-3 text-sm text-gray-600">
              {doctor?.specialization || 'Specialty unavailable'}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                {formatDateLabel(appointment.appointmentDate)}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                {formatTimeLabel(appointment.startTime)} - {formatTimeLabel(appointment.endTime)}
              </span>
              <span className="flex items-center gap-2">
                {appointment.appointmentType === 'VIDEO' ? (
                  <Video className="h-4 w-4 text-blue-600" />
                ) : (
                  <MapPin className="h-4 w-4 text-blue-600" />
                )}
                {appointment.appointmentType === 'VIDEO'
                  ? 'Video Consultation'
                  : getPrimaryClinicLocation(doctor?.clinicLocations)}
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

            {appointment.status === 'PENDING' && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Payment will be available after doctor approval.
              </div>
            )}

            {canPayNow && !paymentFailed && !checkoutCreated && (
              <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                Payment required: complete payment before consultation. This channeling payment is
                non-refundable.
              </div>
            )}

            {checkoutCreated && (
              <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                Checkout session already exists. Click Pay Now to continue securely.
              </div>
            )}

            {paymentFailed && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Previous payment attempt failed. You can retry using Pay Now.
              </div>
            )}

            {appointment.status === 'COMPLETED' && !isPaid && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    This completed appointment has no successful payment recorded. Please contact
                    support.
                  </span>
                </div>
              </div>
            )}

            {isPaid && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Payment successful (
                {formatDisplayAmount(
                  Number(payment?.amount ?? amountDue ?? 0),
                  payment?.currency || amountCurrency,
                )}
                ). Non-refundable policy applies.
              </div>
            )}

            {appointment.status === 'REJECTED' && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                  Next Step
                </p>
                <p className="mt-1 text-sm text-rose-800">
                  This request was rejected. You can safely return to booking and request another
                  slot with the same doctor.
                </p>
              </div>
            )}

            {consultationState && (
              <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                      Video Consultation
                    </p>
                    <h4 className="mt-1 text-sm font-bold text-slate-900">
                      {consultationState.primaryLabel}
                    </h4>
                    <p className="mt-1 text-sm text-slate-700">{consultationState.message}</p>
                    {telemedicineSession?.consultationSummary && (
                      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Meeting Summary
                        </p>
                        <p className="mt-1">{telemedicineSession.consultationSummary}</p>
                      </div>
                    )}
                  </div>

                  {consultationState.canOpenPage && (
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
              disabled={!canPayNow || isPaying}
              onClick={() =>
                setConfirmation({
                  title: 'Proceed to Payment',
                  message:
                    'You will be redirected to the secure payment page for this appointment. Channeling payments are non-refundable.',
                  confirmLabel: 'Continue to Payment',
                  tone: 'primary',
                  details: summaryCard,
                  action: async () => {
                    await handlePayNow(appointment);
                  },
                })
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CreditCard className="h-4 w-4" />
              {isPaying ? 'Redirecting...' : 'Pay Now'}
            </button>
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
              onClick={() =>
                setConfirmation({
                  title: 'Cancel Appointment',
                  message:
                    'This will mark the appointment as cancelled immediately while keeping the record available for history and audit.',
                  confirmLabel: 'Yes, Cancel Appointment',
                  tone: 'danger',
                  details: summaryCard,
                  action: async () => {
                    await handleCancel(appointment.id);
                  },
                })
              }
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBusy && !isRescheduling ? 'Working...' : 'Cancel'}
            </button>
            {appointment.status === 'REJECTED' && (
              <>
                <button
                  type="button"
                  onClick={() => goToBookingPage(appointment)}
                  className="rounded-lg border border-cyan-200 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
                >
                  Request Another Slot
                </button>
                {!dismissedRejectedIds.includes(appointment.id) && (
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmation({
                        title: 'Close Rejected Card',
                        message:
                          'This only hides the rejected appointment card from your current views. The record will remain available in History if you need it later.',
                        confirmLabel: 'Close Card',
                        tone: 'primary',
                        details: summaryCard,
                        action: async () => {
                          await dismissRejectedAppointment(appointment.id);
                        },
                      })
                    }
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Close
                  </button>
                )}
              </>
            )}
            {appointment.status === 'CANCELLED' && !dismissedCancelledIds.includes(appointment.id) && (
              <button
                type="button"
                onClick={() =>
                  setConfirmation({
                    title: 'Remove Cancelled Card',
                    message:
                      'This only hides the cancelled card from your current appointment views. The record stays available in History.',
                    confirmLabel: 'Remove From Current View',
                    tone: 'primary',
                    details: summaryCard,
                    action: async () => {
                      await dismissCancelledAppointment(appointment.id);
                    },
                  })
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Remove
              </button>
            )}
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
                    setRescheduleSlot(null);
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
                    key={`${slot.startTime}-${slot.endTime}`}
                    type="button"
                    onClick={() => setRescheduleSlot(slot)}
                    className={`rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                      rescheduleSlot?.startTime === slot.startTime &&
                      rescheduleSlot?.endTime === slot.endTime
                        ? 'border-blue-600 bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                        : 'border-blue-100 bg-white text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    {formatTimeLabel(slot.startTime)} - {formatTimeLabel(slot.endTime)}
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
                disabled={!rescheduleSlot || isBusy}
                onClick={() =>
                  setConfirmation({
                    title: 'Confirm Reschedule',
                    message:
                      'This will submit your newly selected slot through the same reschedule flow and send it back for doctor confirmation.',
                    confirmLabel: 'Confirm Reschedule',
                    tone: 'primary',
                    details: (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">
                          {doctor ? getDoctorFullName(doctor) : `Doctor #${appointment.doctorId}`}
                        </p>
                        <p className="mt-1">
                          New slot: {formatDateLabel(rescheduleDate)} at{' '}
                          {rescheduleSlot
                            ? `${formatTimeLabel(rescheduleSlot.startTime)} - ${formatTimeLabel(
                                rescheduleSlot.endTime,
                              )}`
                            : 'No slot selected'}
                        </p>
                      </div>
                    ),
                    action: async () => {
                      await handleReschedule(appointment);
                    },
                  })
                }
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="mb-2 text-4xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600">
            Track upcoming visits, review history, and manage appointment requests without changing
            your current booking flow.
          </p>
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
          <>
            <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
                    Appointment Filters
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    {activeFilterMeta.label}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-slate-600">
                    {activeFilterMeta.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {hiddenCancelledCount > 0 && (
                    <button
                      type="button"
                      onClick={restoreDismissedCancelledAppointments}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Restore Removed Cancelled Cards ({hiddenCancelledCount})
                    </button>
                  )}
                  {hiddenRejectedCount > 0 && (
                    <button
                      type="button"
                      onClick={restoreDismissedRejectedAppointments}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Restore Closed Rejected Cards ({hiddenRejectedCount})
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {filterOptions.map((option) => {
                  const isActive = option.value === activeFilter;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setActiveFilter(option.value)}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        isActive
                          ? 'border-blue-600 bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">{option.label}</span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
                          }`}
                        >
                          {filterCounts[option.value]}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {filteredAppointments.length === 0 ? (
              <div className="rounded-2xl border border-gray-200/40 bg-white p-10 text-center shadow-lg">
                <Calendar className="mx-auto mb-4 h-10 w-10 text-blue-600" />
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  No {activeFilterMeta.label} Appointments
                </h2>
                <p className="text-gray-600">{activeFilterMeta.description}</p>
              </div>
            ) : activeFilter === 'UPCOMING' ? (
              <div className="space-y-6">
                <section className="rounded-3xl border border-orange-200 bg-orange-50/40 p-5 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-slate-900">Payment Due</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Upcoming appointments that still need payment before consultation.
                    </p>
                  </div>

                  {upcomingPaymentDueAppointments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-orange-200 bg-white/70 p-6 text-center">
                      <p className="font-semibold text-slate-900">No payment due appointments</p>
                      <p className="mt-1 text-sm text-slate-600">
                        All of your current upcoming appointments are already paid.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingPaymentDueAppointments.map((appointment) => renderAppointmentCard(appointment))}
                    </div>
                  )}
                </section>

                <section className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-slate-900">Paid Appointments</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Upcoming appointments with successful payment already recorded.
                    </p>
                  </div>

                  {upcomingPaidAppointments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/70 p-6 text-center">
                      <p className="font-semibold text-slate-900">No paid upcoming appointments</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Paid upcoming appointment cards will appear here once payment is completed.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingPaidAppointments.map((appointment) => renderAppointmentCard(appointment))}
                    </div>
                  )}
                </section>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => renderAppointmentCard(appointment))}
              </div>
            )}
          </>
        )}
      </div>

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

