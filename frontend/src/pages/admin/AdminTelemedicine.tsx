import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, FileText, MonitorPlay, UserRound } from 'lucide-react';
import {
  getAdminTelemedicineSessions,
  type TelemedicineSessionResponse,
} from '../../services/telemedicineApi';

function formatDateLabel(date?: string | null) {
  if (!date) {
    return 'N/A';
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeLabel(time?: string | null) {
  if (!time) {
    return 'N/A';
  }

  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const normalizedHours = hours % 12 || 12;
  return `${normalizedHours}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

const statConfig = [
  {
    key: 'total',
    label: 'Total Sessions',
    tone: 'from-sky-500 to-cyan-500',
  },
  {
    key: 'created',
    label: 'Waiting To Start',
    tone: 'from-amber-500 to-orange-500',
  },
  {
    key: 'started',
    label: 'In Progress',
    tone: 'from-emerald-500 to-green-600',
  },
  {
    key: 'completed',
    label: 'Completed',
    tone: 'from-slate-700 to-slate-900',
  },
] as const;

export default function AdminTelemedicine() {
  const [sessions, setSessions] = useState<TelemedicineSessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadSessions = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await getAdminTelemedicineSessions();
        if (isMounted) {
          setSessions(response);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load telemedicine summaries');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSessions();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const summary = {
      total: sessions.length,
      created: 0,
      started: 0,
      completed: 0,
    };

    sessions.forEach((session) => {
      const status = (session.status || '').toUpperCase();
      if (status === 'CREATED') {
        summary.created += 1;
      } else if (status === 'STARTED') {
        summary.started += 1;
      } else if (status === 'COMPLETED') {
        summary.completed += 1;
      }
    });

    return summary;
  }, [sessions]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-[#10356a] via-[#1a4c80] to-[#21689a] p-6 text-white shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">Telemedicine Oversight</p>
        <h2 className="mt-1 text-3xl font-black">Consultation Session Summary</h2>
        <p className="mt-2 max-w-2xl text-sm text-cyan-100/90">
          Review all video consultation sessions, meeting states, and doctor-entered summaries from one place.
        </p>
      </section>

      {error && <p className="rounded-xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statConfig.map((stat) => (
          <article key={stat.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`inline-flex rounded-xl bg-gradient-to-r p-2 text-white ${stat.tone}`}>
              <MonitorPlay className="h-4 w-4" />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-600">{stat.label}</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{isLoading ? '...' : stats[stat.key]}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Meeting Ledger</h3>
            <p className="text-sm text-slate-500">Appointment-by-appointment consultation visibility for admin review.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {sessions.length} sessions
          </span>
        </div>

        {isLoading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Loading telemedicine sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No telemedicine sessions have been created yet.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {sessions.map((session) => (
              <article key={session.sessionId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-bold text-slate-900">Appointment #{session.appointmentId}</h4>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          session.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : session.status === 'STARTED'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Participants</p>
                        <div className="mt-2 space-y-1 text-sm text-slate-700">
                          <p className="flex items-center gap-2">
                            <UserRound className="h-4 w-4 text-slate-500" />
                            Doctor #{session.doctorId ?? 'N/A'}
                          </p>
                          <p className="flex items-center gap-2">
                            <UserRound className="h-4 w-4 text-slate-500" />
                            Patient #{session.patientId ?? 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Schedule</p>
                        <div className="mt-2 space-y-1 text-sm text-slate-700">
                          <p className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-slate-500" />
                            {formatDateLabel(session.appointmentDate)}
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-slate-500" />
                            {formatTimeLabel(session.startTime)} - {formatTimeLabel(session.endTime)}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lifecycle</p>
                        <div className="mt-2 space-y-1 text-sm text-slate-700">
                          <p>Created: {session.createdAt ? new Date(session.createdAt).toLocaleString() : 'N/A'}</p>
                          <p>Started: {session.startedAt ? new Date(session.startedAt).toLocaleString() : 'Not started'}</p>
                          <p>Closed: {session.completedAt ? new Date(session.completedAt).toLocaleString() : 'Open'}</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Billing</p>
                        <div className="mt-2 space-y-1 text-sm text-slate-700">
                          <p>Payment #{session.paymentId ?? 'N/A'}</p>
                          <p>
                            {session.amount ?? 'N/A'} {session.currency || ''}
                          </p>
                          <p>{session.appointmentType || 'VIDEO'}</p>
                        </div>
                      </div>
                    </div>

                    {session.reasonForVisit && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reason For Visit</p>
                        <p className="mt-1 text-sm text-slate-700">{session.reasonForVisit}</p>
                      </div>
                    )}

                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <div className="flex items-center gap-2 text-emerald-800">
                        <FileText className="h-4 w-4" />
                        <p className="text-xs font-semibold uppercase tracking-wide">Consultation Summary</p>
                      </div>
                      <p className="mt-2 text-sm text-emerald-900">
                        {session.consultationSummary || 'No doctor summary has been recorded for this meeting yet.'}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
