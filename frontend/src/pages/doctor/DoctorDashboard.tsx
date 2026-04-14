import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  MoreHorizontal,
  Search,
  ShieldCheck,
  UserCircle2,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { DoctorStatusBadge } from '../../components/doctor/DoctorStatusBadge';
import { DoctorTopNav } from '../../components/doctor/DoctorTopNav';
import { getMyDoctorAppointments, type AppointmentResponse } from '../../services/appointmentsApi';
import { getDashboardSummary } from '../../services/doctor/doctorApi';
import type { DoctorDashboardSummary } from '../../types/doctor';

type QueueStatus = 'Confirmed' | 'Waiting' | 'Completed' | 'Cancelled';

function formatTime(time: string) {
  const value = (time || '').slice(0, 5);
  if (!value.includes(':')) {
    return time;
  }

  const [hourRaw, minute] = value.split(':');
  const hour = Number(hourRaw);
  if (!Number.isFinite(hour)) {
    return time;
  }

  const normalizedHour = hour % 12 || 12;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${normalizedHour}:${minute} ${suffix}`;
}

function isSameDay(dateValue: string, target: Date) {
  const date = new Date(dateValue);
  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  );
}

function mapAppointmentToQueueStatus(status: AppointmentResponse['status']): QueueStatus {
  if (status === 'CONFIRMED') {
    return 'Confirmed';
  }

  if (status === 'COMPLETED') {
    return 'Completed';
  }

  if (status === 'CANCELLED' || status === 'REJECTED') {
    return 'Cancelled';
  }

  return 'Waiting';
}

function getQueueStatusStyles(status: QueueStatus) {
  if (status === 'Confirmed') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'Waiting') {
    return 'bg-slate-100 text-slate-600';
  }

  if (status === 'Completed') {
    return 'bg-blue-100 text-blue-700';
  }

  return 'bg-rose-100 text-rose-700';
}

export default function DoctorDashboard() {
  const params = useParams();
  const doctorId = Number(params.id || 0);

  const [summary, setSummary] = useState<DoctorDashboardSummary | null>(null);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSummary = async () => {
      if (!doctorId) {
        setError('Invalid doctor id.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [result, doctorAppointments] = await Promise.all([
          getDashboardSummary(doctorId),
          getMyDoctorAppointments(),
        ]);
        setSummary(result);
        setAppointments(Array.isArray(doctorAppointments) ? doctorAppointments : []);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Failed to load doctor dashboard summary.');
      } finally {
        setLoading(false);
      }
    };

    void loadSummary();
  }, [doctorId]);

  const today = useMemo(() => {
    const now = new Date();
    return {
      date: now.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: now.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  }, []);

  const todayDate = useMemo(() => new Date(), []);

  const todayAppointments = useMemo(
    () => appointments.filter((appointment) => isSameDay(appointment.appointmentDate, todayDate)),
    [appointments, todayDate],
  );

  const queueRows = useMemo(() => {
    return todayAppointments
      .filter((appointment) => appointment.status !== 'REJECTED')
      .sort((a, b) => `${a.startTime}`.localeCompare(`${b.startTime}`))
      .slice(0, 8)
      .map((appointment, index) => ({
        id: index + 1,
        patientName: `Patient #${appointment.patientId}`,
        time: formatTime(appointment.startTime),
        ageGender: '--',
        status: mapAppointmentToQueueStatus(appointment.status),
        reason: appointment.reasonForVisit || appointment.appointmentType,
      }));
  }, [todayAppointments]);

  const pendingRequests = useMemo(
    () =>
      todayAppointments
        .filter((appointment) => appointment.status === 'PENDING')
        .sort((a, b) => `${a.startTime}`.localeCompare(`${b.startTime}`))
        .slice(0, 4)
        .map((appointment) => ({
          id: appointment.id,
          name: `Patient #${appointment.patientId}`,
          section: appointment.appointmentType === 'VIDEO' ? 'Telehealth' : 'In-person',
        })),
    [todayAppointments],
  );

  const confirmedTodayCount = useMemo(
    () => todayAppointments.filter((appointment) => appointment.status === 'CONFIRMED').length,
    [todayAppointments],
  );

  const completedTodayCount = useMemo(
    () => todayAppointments.filter((appointment) => appointment.status === 'COMPLETED').length,
    [todayAppointments],
  );

  const pendingTodayCount = useMemo(
    () => todayAppointments.filter((appointment) => appointment.status === 'PENDING').length,
    [todayAppointments],
  );

  const availableRatio = useMemo(() => {
    const total = summary?.totalSlots || 0;
    const available = summary?.availableSlots || 0;

    if (total <= 0) {
      return 0;
    }

    return Math.min(Math.max(Math.round((available / total) * 100), 0), 100);
  }, [summary?.availableSlots, summary?.totalSlots]);

  const todaysAppointments = todayAppointments.length;

  return (
    <div className="min-h-screen bg-[#e8f1f4] relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 lg:px-8 text-slate-900 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(87,184,193,0.22),transparent_45%),radial-gradient(circle_at_85%_25%,rgba(64,145,168,0.18),transparent_40%),radial-gradient(circle_at_30%_85%,rgba(206,233,238,0.7),transparent_42%)]" />
      <div className="absolute inset-0 backdrop-blur-[1px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <DoctorTopNav doctorId={doctorId} />

        {loading && (
          <div className="h-64 animate-pulse rounded-[2.5rem] border border-white bg-white/60 backdrop-blur-md shadow-sm" />
        )}
        {!loading && error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-rose-200 bg-rose-50/80 backdrop-blur-sm p-5 shadow-sm">
             <p className="text-sm font-semibold text-rose-700">{error}</p>
          </motion.div>
        )}

        {!loading && summary && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-[1.6rem] border border-white/60 bg-white/45 p-4 sm:p-6 shadow-[0_18px_60px_rgba(13,55,78,0.14)] backdrop-blur-xl"
          >
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <div className="rounded-[1.3rem] border border-white/70 bg-white/58 p-4 sm:p-5 shadow-inner">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-teal-700">Welcome back</p>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Doctor, {summary.doctorName}</h1>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
                    <Search className="h-4 w-4" />
                    <span>Search</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="rounded-full border border-slate-200 bg-white p-2 text-slate-600">
                      <Bell className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded-full border border-slate-200 bg-white p-2 text-slate-600">
                      <Mail className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded-full border border-slate-200 bg-white p-2 text-slate-600">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <CalendarDays className="h-4 w-4 text-teal-600" />
                    <span>{today.date}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-500">{today.time}</p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/85">
                  <div className="grid grid-cols-[40px_1.3fr_0.8fr_0.7fr_0.95fr_1fr] gap-2 border-b border-slate-200 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <span>#</span>
                    <span>Patient Name</span>
                    <span>Time</span>
                    <span>Age/Gender</span>
                    <span>Status</span>
                    <span>Reason</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {!queueRows.length && (
                      <p className="px-4 py-6 text-sm font-medium text-slate-500">No appointments scheduled for today.</p>
                    )}
                    {queueRows.map((row) => (
                      <div key={row.id} className="grid grid-cols-[40px_1.3fr_0.8fr_0.7fr_0.95fr_1fr] items-center gap-2 px-3 py-3 text-sm text-slate-700">
                        <p className="text-xs font-semibold text-slate-500">{row.id}.</p>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                            <UserCircle2 className="h-5 w-5" />
                          </div>
                          <p className="text-xs sm:text-sm font-semibold">{row.patientName}</p>
                        </div>
                        <p className="text-xs sm:text-sm">{row.time}</p>
                        <p className="text-xs sm:text-sm">{row.ageGender}</p>
                        <span className={`inline-flex w-fit rounded-full px-2 py-1 text-[11px] font-bold ${getQueueStatusStyles(row.status)}`}>
                          {row.status}
                        </span>
                        <p className="truncate text-xs sm:text-sm">{row.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 grid-rows-[auto_auto]">
                <div className="rounded-[1.3rem] border border-white/70 bg-white/65 p-4 shadow-inner">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Pending Requests</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">{pendingRequests.length}</span>
                  </div>

                  {!pendingRequests.length ? (
                    <p className="text-sm text-slate-500">No pending requests for today.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {pendingRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5">
                          <div>
                            <p className="text-xs font-semibold text-slate-500">{request.section}</p>
                            <p className="text-sm font-bold text-slate-800">{request.name}</p>
                          </div>
                          <Link to="/doctor/appointments" className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50">
                            Review
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-[1.3rem] border border-white/70 bg-white/65 p-4 shadow-inner">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Quick Analytics</h2>
                    <DoctorStatusBadge status={summary.verificationStatus} />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold text-slate-500">Profile Score</p>
                      <p className="mt-1 text-2xl font-black text-slate-900">{summary.profileCompletenessScore}%</p>
                      <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {summary.active ? 'Profile active' : 'Profile inactive'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold text-slate-500">Appointments Today</p>
                      <p className="mt-1 text-2xl font-black text-slate-900">{todaysAppointments}</p>
                      <p className="mt-1 text-xs text-teal-700 flex items-center gap-1">
                        <Activity className="h-3.5 w-3.5" />
                        {confirmedTodayCount} confirmed, {pendingTodayCount} pending
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold text-slate-500">Completed Today</p>
                      <p className="mt-1 text-2xl font-black text-slate-900">{completedTodayCount}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold text-slate-500">Slot Utilization</p>
                      <p className="mt-1 text-2xl font-black text-slate-900">{100 - availableRatio}%</p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Availability Ring</p>
                      <p className="text-xs font-bold text-slate-600">{availableRatio}%</p>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div
                        className="h-20 w-20 rounded-full"
                        style={{
                          background: `conic-gradient(#0d9488 ${availableRatio * 3.6}deg, #dbe5ea 0deg)`,
                        }}
                      >
                        <div className="m-2 flex h-16 w-16 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-700">
                          {availableRatio}%
                        </div>
                      </div>
                      <div className="text-sm text-slate-600">
                        <p className="font-semibold">{summary.availableSlots} available</p>
                        <p className="font-semibold">{summary.totalSlots} total slots</p>
                        <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          Updated from live schedule
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.2rem] border border-slate-200 bg-white/85 p-4 mt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Profile Insight</p>
                  <p className="text-sm leading-relaxed text-slate-600">{summary.profileInsight}</p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {summary.specialization}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
