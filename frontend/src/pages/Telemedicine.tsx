import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  MessageSquareText,
  Minimize2,
  MonitorPlay,
  PhoneOff,
  PlayCircle,
  ShieldCheck,
  UserRound,
  Video,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getAppointmentById, completeAppointment, type AppointmentResponse } from '../services/appointmentsApi';
import {
  completeTelemedicineSession,
  createTelemedicineSession,
  type TelemedicineSessionResponse,
  startTelemedicineSession,
} from '../services/telemedicineApi';
import {
  completeConsultation,
  getPaymentByAppointmentId,
  isPaymentNotFoundError,
  type PaymentResponse,
} from '../services/paymentApi';
import { getAuthUserRole } from '../services/authSession';
import {
  getConsultationAccessState,
  getConsultationRoomOpenAt,
  type ConsultationRole,
} from '../utils/telemedicine/telemedicineFlow';

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

export default function Telemedicine() {
  const { id } = useParams();
  const appointmentId = Number(id);
  const role = getAuthUserRole();
  const consultationRole = role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';
  const isDoctor = consultationRole === 'DOCTOR';

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionState, setActionState] = useState<'idle' | 'starting' | 'completing'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [softMessage, setSoftMessage] = useState('');
  const [summaryDraft, setSummaryDraft] = useState('');
  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [session, setSession] = useState<TelemedicineSessionResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
        if (isMounted) {
          setErrorMessage('Invalid appointment id in consultation link.');
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage('');
        setSoftMessage('');

        const appointmentResponse = await getAppointmentById(appointmentId);
        if (!isMounted) {
          return;
        }
        setAppointment(appointmentResponse);

        let paymentResponse: PaymentResponse | null = null;
        try {
          paymentResponse = await getPaymentByAppointmentId(appointmentId);
          if (isMounted) {
            setPayment(paymentResponse);
          }
        } catch (paymentError) {
          if (!isPaymentNotFoundError(paymentError) && isMounted) {
            setSoftMessage(
              paymentError instanceof Error
                ? paymentError.message
                : 'Payment details could not be loaded right now.',
            );
          }
        }

        const normalizedPaymentStatus = (appointmentResponse.paymentStatusHint || '').toUpperCase();
        const canPrepareRoom =
          appointmentResponse.appointmentType === 'VIDEO' &&
          (normalizedPaymentStatus === 'PAID' || normalizedPaymentStatus === 'COMPLETED');

        if (!canPrepareRoom) {
          return;
        }

        const nextSession = await createTelemedicineSession({
          appointmentId: appointmentResponse.id,
          paymentId: paymentResponse?.paymentId,
          patientId: appointmentResponse.patientId,
          doctorId: appointmentResponse.doctorId,
          appointmentDate: appointmentResponse.appointmentDate,
          startTime: appointmentResponse.startTime,
          endTime: appointmentResponse.endTime,
          appointmentType: appointmentResponse.appointmentType,
          amount: paymentResponse?.amount ?? appointmentResponse.finalFee ?? undefined,
          currency: paymentResponse?.currency ?? appointmentResponse.feeCurrency ?? undefined,
          reasonForVisit: appointmentResponse.reasonForVisit,
        });

        if (!isMounted) {
          return;
        }

        setSession(nextSession);
        setSummaryDraft(nextSession.consultationSummary || '');
      } catch (bootstrapError) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          bootstrapError instanceof Error
            ? bootstrapError.message
            : 'Unable to prepare the consultation room.',
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, [appointmentId]);

  const accessState = useMemo(() => {
    if (!appointment) {
      return null;
    }

    return getConsultationAccessState(
      appointment,
      session,
      consultationRole as ConsultationRole,
    );
  }, [appointment, consultationRole, session]);

  const sessionStatus = session?.status?.toUpperCase() ?? 'CREATED';
  const canStart = Boolean(isDoctor && accessState?.roomWindowOpen && sessionStatus === 'CREATED');
  const canJoin = Boolean(session?.meetingUrl && sessionStatus === 'STARTED');
  const canComplete = Boolean(isDoctor && sessionStatus === 'STARTED');
  const roomOpensAt = appointment ? getConsultationRoomOpenAt(appointment) : null;
  const dashboardHref = isDoctor ? '/doctor/appointments' : '/appointments';

  const handleOpenRoom = () => {
    if (!session?.meetingUrl || !canJoin) {
      return;
    }

    window.open(session.meetingUrl, '_blank', 'noopener,noreferrer');
  };

  const handleStartSession = async () => {
    if (!session || !canStart) {
      return;
    }

    setActionState('starting');
    setErrorMessage('');
    try {
      const updatedSession = await startTelemedicineSession(session.sessionId);
      setSession(updatedSession);
      setSoftMessage('Consultation started. The patient can join now.');
    } catch (startError) {
      setErrorMessage(startError instanceof Error ? startError.message : 'Unable to start the consultation.');
    } finally {
      setActionState('idle');
    }
  };

  const handleCompleteSession = async () => {
    if (!session || !appointment || !canComplete) {
      return;
    }

    setActionState('completing');
    setErrorMessage('');
    setSoftMessage('');

    try {
      const updatedSession = await completeTelemedicineSession(session.sessionId, {
        consultationSummary: summaryDraft.trim() || undefined,
      });
      setSession(updatedSession);

      const syncResults = await Promise.allSettled([
        completeAppointment(appointment.id),
        payment?.paymentId ? completeConsultation(payment.paymentId, summaryDraft.trim() || undefined) : Promise.resolve(null),
      ]);

      const rejected = syncResults.filter((result) => result.status === 'rejected');
      if (rejected.length > 0) {
        setSoftMessage('Consultation room was closed, but one downstream status update needs a retry.');
      } else {
        setSoftMessage('Consultation completed and the room has been locked.');
      }
    } catch (completeError) {
      setErrorMessage(
        completeError instanceof Error
          ? completeError.message
          : 'Unable to complete the consultation.',
      );
    } finally {
      setActionState('idle');
    }
  };

  const renderMainPanel = () => {
    if (isLoading) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
          <p className="text-sm text-slate-300">Preparing your consultation workspace...</p>
        </div>
      );
    }

    if (errorMessage) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className="max-w-xl text-lg font-semibold text-rose-200">{errorMessage}</p>
          <p className="mt-2 text-sm text-slate-300">
            Return to the appointments page and try again once the supporting services are ready.
          </p>
        </div>
      );
    }

    if (!appointment || !accessState) {
      return null;
    }

    if (sessionStatus === 'COMPLETED') {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <CheckCircle2 className="h-14 w-14 text-emerald-300" />
          <h2 className="mt-4 text-2xl font-bold text-white">Consultation closed</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            This meeting has been completed and the application will not reopen the room again.
          </p>
          {session?.consultationSummary && (
            <div className="mt-5 max-w-2xl rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-left">
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/80">Consultation Summary</p>
              <p className="mt-2 text-sm text-emerald-50">{session.consultationSummary}</p>
            </div>
          )}
        </div>
      );
    }

    if (!accessState.roomWindowOpen) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <Clock3 className="h-14 w-14 text-cyan-300" />
          <h2 className="mt-4 text-2xl font-bold text-white">Room opens soon</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            {roomOpensAt
              ? `The consultation room opens at ${roomOpensAt.toLocaleString()}.`
              : accessState.message}
          </p>
        </div>
      );
    }

    if (!canJoin) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <ShieldCheck className="h-14 w-14 text-cyan-300" />
          <h2 className="mt-4 text-2xl font-bold text-white">
            {isDoctor ? 'Start the consultation' : 'Waiting for doctor'}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-300">{accessState.message}</p>
        </div>
      );
    }

    return (
      <iframe
        src={session?.meetingUrl || undefined}
        title="Telemedicine Consultation"
        allow="camera; microphone; autoplay; fullscreen; display-capture; clipboard-read; clipboard-write"
        className="h-full w-full border-0"
      />
    );
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'} bg-slate-950 px-4 pb-12 pt-24 text-white sm:px-6 lg:px-8`}>
      <div className={`${isFullscreen ? 'h-full' : 'mx-auto max-w-7xl'}`}>
        {!isFullscreen && (
          <div className="mb-4 flex justify-end">
            <Link
              to={dashboardHref}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-2.5 font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
            >
              <LayoutDashboard className="h-5 w-5" />
              Back to Appointments
            </Link>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/30"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Video Consultation</p>
                <h1 className="mt-1 text-2xl font-semibold text-white">
                  {isDoctor ? 'Doctor Consultation Room' : 'Patient Consultation Room'}
                </h1>
              </div>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <MonitorPlay className="h-4 w-4" />}
                {isFullscreen ? 'Exit Fullscreen' : 'Focus Mode'}
              </button>
            </div>

            <div className="relative aspect-[16/10] bg-slate-900">
              {renderMainPanel()}
            </div>

            <div className="grid gap-3 border-t border-white/10 bg-slate-950/60 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
              <button
                onClick={handleStartSession}
                disabled={!canStart || actionState !== 'idle'}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                {actionState === 'starting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                Start Session
              </button>
              <button
                onClick={handleOpenRoom}
                disabled={!canJoin}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
              >
                <ExternalLink className="h-4 w-4" />
                Open Room
              </button>
              <button
                onClick={handleCompleteSession}
                disabled={!canComplete || actionState !== 'idle'}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
              >
                {actionState === 'completing' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Complete Session
              </button>
              <Link
                to={dashboardHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                <PhoneOff className="h-4 w-4" />
                Leave Room
              </Link>
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-slate-950/30"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Consultation Flow</p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                Appointment #{appointmentId || 'N/A'}
              </h2>
            </div>

            {appointment && (
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-200">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-cyan-300" />
                    {formatDateLabel(appointment.appointmentDate)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-cyan-300" />
                    {formatTimeLabel(appointment.startTime)} - {formatTimeLabel(appointment.endTime)}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <p className="flex items-start gap-2">
                    <UserRound className="mt-0.5 h-4 w-4 text-cyan-300" />
                    <span>{isDoctor ? 'You can start the consultation once the room window opens.' : 'You can join after the doctor starts the consultation.'}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Video className="mt-0.5 h-4 w-4 text-cyan-300" />
                    <span>{accessState?.message || 'Consultation status is being prepared.'}</span>
                  </p>
                </div>
              </div>
            )}

            {softMessage && (
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-50">
                {softMessage}
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm font-medium text-slate-300">Session Status</p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-100">
                <span className="h-2 w-2 rounded-full bg-cyan-300" />
                {sessionStatus}
              </div>
              {session?.startedAt && (
                <p className="mt-3 text-sm text-slate-400">
                  Started: {new Date(session.startedAt).toLocaleString()}
                </p>
              )}
              {session?.completedAt && (
                <p className="mt-1 text-sm text-slate-400">
                  Closed: {new Date(session.completedAt).toLocaleString()}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm font-medium text-slate-300">Room ID</p>
              <p className="mt-2 break-all text-sm text-slate-400">{session?.roomId ?? 'Preparing room...'}</p>
              {session?.meetingUrl && sessionStatus !== 'COMPLETED' ? (
                <>
                  <p className="mt-4 text-sm font-medium text-slate-300">Meeting URL</p>
                  <p className="mt-2 break-all text-sm text-slate-400">{session.meetingUrl}</p>
                </>
              ) : (
                <p className="mt-4 text-sm text-slate-500">The room link is hidden after completion to stop re-entry from the app.</p>
              )}
            </div>

            {isDoctor && sessionStatus === 'STARTED' && (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-sm font-medium text-emerald-50">Doctor Completion Summary</p>
                <textarea
                  rows={5}
                  value={summaryDraft}
                  onChange={(event) => setSummaryDraft(event.target.value)}
                  className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-300"
                  placeholder="Add a concise consultation summary for records and admin review"
                />
                <p className="mt-2 text-xs text-emerald-100/80">
                  This summary is shown after the meeting closes and is available to admin review.
                </p>
              </div>
            )}

            {session?.consultationSummary && sessionStatus === 'COMPLETED' && (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <div className="flex items-center gap-2 text-emerald-50">
                  <MessageSquareText className="h-4 w-4" />
                  <p className="text-sm font-medium">Consultation Summary</p>
                </div>
                <p className="mt-3 text-sm text-emerald-50">{session.consultationSummary}</p>
              </div>
            )}

            {roomOpensAt && sessionStatus !== 'COMPLETED' && (
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-sm font-medium text-slate-300">Room Availability</p>
                <p className="mt-2 text-sm text-slate-400">
                  Available from {roomOpensAt.toLocaleString()}.
                </p>
              </div>
            )}
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
