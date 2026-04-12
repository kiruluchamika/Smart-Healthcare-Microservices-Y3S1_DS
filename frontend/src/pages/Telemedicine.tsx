import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  Maximize2,
  Minimize2,
  PhoneOff,
  PlayCircle,
  Users,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import {
  completeTelemedicineSession,
  createTelemedicineSession,
  startTelemedicineSession,
  type TelemedicineSessionResponse,
} from '../services/telemedicineApi';
import { updateAppointmentPaymentStatus } from '../services/appointmentsApi';

export default function Telemedicine() {
  const { id } = useParams();
  const appointmentId = Number(id);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionState, setActionState] = useState<'idle' | 'starting' | 'completing'>('idle');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [session, setSession] = useState<TelemedicineSessionResponse | null>(null);

  const sessionStatus = session?.status?.toUpperCase() ?? 'CREATED';
  const canStart = sessionStatus === 'CREATED';
  const canComplete = sessionStatus === 'STARTED';

  const meetingLink = useMemo(() => session?.meetingUrl ?? '', [session]);

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

        const createdSession = await createTelemedicineSession({ appointmentId });
        if (!isMounted) {
          return;
        }

        setSession(createdSession);

        try {
          await updateAppointmentPaymentStatus(appointmentId, {
            paymentStatus: 'PAID',
            telemedicineSessionUrl: createdSession.meetingUrl,
            paidAt: createdSession.createdAt,
          });
        } catch {
          // The room is already usable even if the mirror update fails.
        }
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

  const copyMeetingLink = async () => {
    if (!meetingLink) {
      return;
    }

    await navigator.clipboard.writeText(meetingLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const openMeetingInNewTab = () => {
    if (!meetingLink) {
      return;
    }

    window.open(meetingLink, '_blank', 'noopener,noreferrer');
  };

  const handleStartSession = async () => {
    if (!session) {
      return;
    }

    setActionState('starting');
    try {
      const updatedSession = await startTelemedicineSession(session.sessionId);
      setSession(updatedSession);
    } finally {
      setActionState('idle');
    }
  };

  const handleCompleteSession = async () => {
    if (!session) {
      return;
    }

    setActionState('completing');
    try {
      const updatedSession = await completeTelemedicineSession(session.sessionId);
      setSession(updatedSession);
    } finally {
      setActionState('idle');
    }
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0' : 'min-h-screen'} bg-slate-950 px-4 pb-12 pt-24 text-white sm:px-6 lg:px-8`}>
      <div className={`${isFullscreen ? 'h-full' : 'mx-auto max-w-7xl'}`}>
        {!isFullscreen && (
          <div className="mb-4 flex justify-end">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-2.5 font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Link>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/30"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Video Consultation</p>
                <h1 className="mt-1 text-2xl font-semibold text-white">Jitsi Room</h1>
              </div>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>
            </div>

            <div className="relative aspect-[16/10] bg-slate-900">
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80">
                  <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
                  <p className="text-sm text-slate-300">Preparing your consultation room...</p>
                </div>
              )}

              {!isLoading && errorMessage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                  <p className="max-w-xl text-lg font-semibold text-rose-200">{errorMessage}</p>
                  <p className="mt-2 text-sm text-slate-300">
                    Open the appointment again after confirming the backend services are running.
                  </p>
                </div>
              )}

              {!isLoading && !errorMessage && session?.meetingUrl && (
                <iframe
                  src={session.meetingUrl}
                  title="Telemedicine Consultation"
                  allow="camera; microphone; autoplay; fullscreen; display-capture; clipboard-read; clipboard-write"
                  className="h-full w-full border-0"
                />
              )}
            </div>

            <div className="grid gap-3 border-t border-white/10 bg-slate-950/60 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
              <button
                onClick={handleStartSession}
                disabled={!session || !canStart || actionState !== 'idle'}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                {actionState === 'starting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                Start Session
              </button>
              <button
                onClick={handleCompleteSession}
                disabled={!session || !canComplete || actionState !== 'idle'}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
              >
                {actionState === 'completing' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Complete
              </button>
              <button
                onClick={copyMeetingLink}
                disabled={!meetingLink}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copied' : 'Copy Link'}
              </button>
              <button
                onClick={openMeetingInNewTab}
                disabled={!meetingLink}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
              >
                <ExternalLink className="h-4 w-4" />
                Open Room
              </button>
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-slate-950/30"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Session Details</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Appointment #{appointmentId || 'N/A'}</h2>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="flex items-center gap-3 text-sm text-slate-200">
                <Users className="h-4 w-4 text-cyan-300" />
                <span>Room ID</span>
              </div>
              <p className="mt-2 break-all text-sm text-slate-400">{session?.roomId ?? 'Preparing room...'}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm font-medium text-slate-300">Status</p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-100">
                <span className="h-2 w-2 rounded-full bg-cyan-300" />
                {sessionStatus}
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Doctor and patient can join the same room by using the generated Jitsi URL.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm font-medium text-slate-300">Meeting URL</p>
              <p className="mt-2 break-all text-sm text-slate-400">{meetingLink || 'No URL available yet'}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-500">Provider</p>
              <p className="mt-1 text-sm font-medium text-slate-200">{session?.provider || 'JITSI'}</p>
            </div>

            {session?.createdAt && (
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-sm font-medium text-slate-300">Created At</p>
                <p className="mt-2 text-sm text-slate-400">{new Date(session.createdAt).toLocaleString()}</p>
              </div>
            )}

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-50">
              Use the consultation room on both the doctor and patient side. The session status moves from CREATED to STARTED, then to COMPLETED when the meeting ends.
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={copyMeetingLink}
                disabled={!meetingLink}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:text-slate-500"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </button>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-900"
              >
                <PhoneOff className="h-4 w-4" />
                Leave Room
              </Link>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
