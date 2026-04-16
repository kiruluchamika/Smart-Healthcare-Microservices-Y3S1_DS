import PatientDashboardPage from './patient/PatientDashboard';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Bell,
  Calendar,
  CalendarRange,
  CalendarDays,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  UserCircle,
  Video,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAuthUserRole, getAuthUser } from '../services/authSession';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDoctorByEmail, getDashboardSummary } from '../services/doctor/doctorApi';
import { getMyDoctorAppointments, type AppointmentResponse } from '../services/appointmentsApi';
import type { DoctorServiceDoctor, DoctorDashboardSummary } from '../types/doctor';

type QueueStatus = 'Confirmed' | 'Waiting' | 'Arrived' | 'In Progress' | 'Active' | 'Completed' | 'Cancelled';

function getQueueStatusStyles(status: QueueStatus) {
  if (status === 'Confirmed') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Waiting') return 'bg-slate-100 text-slate-600';
  if (status === 'Arrived') return 'bg-cyan-100 text-cyan-700';
  if (status === 'In Progress') return 'bg-blue-100 text-blue-700';
  if (status === 'Completed') return 'bg-teal-100 text-teal-700';
  if (status === 'Cancelled') return 'bg-rose-100 text-rose-700';
  return 'bg-teal-100 text-teal-700';
}

function mapAppointmentToQueueStatus(status: AppointmentResponse['status']): QueueStatus {
  if (status === 'CONFIRMED') {
    return 'Confirmed';
  }
  if (status === 'PENDING') {
    return 'Waiting';
  }
  if (status === 'COMPLETED') {
    return 'Completed';
  }
  if (status === 'CANCELLED' || status === 'REJECTED') {
    return 'Cancelled';
  }
  return 'Active';
}

function formatTime(time: string) {
  const [h, m] = time.slice(0, 5).split(':');
  const hr = parseInt(h, 10);
  if (!Number.isFinite(hr)) {
    return time;
  }

  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

function isSameDay(dateText: string, baseDate: Date) {
  const date = new Date(dateText);
  return (
    date.getFullYear() === baseDate.getFullYear() &&
    date.getMonth() === baseDate.getMonth() &&
    date.getDate() === baseDate.getDate()
  );
}

function DoctorDashboardView() {
  const authUser = getAuthUser();
  const [doctor, setDoctor] = useState<DoctorServiceDoctor | null>(null);
  const [summary, setSummary] = useState<DoctorDashboardSummary | null>(null);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [queueFilter, setQueueFilter] = useState<'ALL' | QueueStatus>('ALL');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const loadDoctorData = useCallback(async (silent = false) => {
    const user = getAuthUser();
    if (!user?.email) {
      setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
    }

    try {
      const doc = await getDoctorByEmail(user.email);
      setDoctor(doc);

      try {
        const [sum, appts] = await Promise.all([
          getDashboardSummary(doc.id),
          getMyDoctorAppointments(),
        ]);
        setSummary(sum);
        setAppointments(appts || []);
        setLastUpdatedAt(new Date());
      } catch (sumErr) {
        console.error('Failed to load dashboard summary or appointments', sumErr);
      }
    } catch (err) {
      console.log('Doctor profile not created yet.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadDoctorData();
  }, [loadDoctorData]);

  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      void loadDoctorData(true);
    }, 30000);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [loadDoctorData]);

  const today = new Date();
  const todayDate = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const nowTime = today.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const todayAppointments = useMemo(
    () => appointments.filter((appointment) => isSameDay(appointment.appointmentDate, today)),
    [appointments, today],
  );

  const confirmedAppointments = useMemo(
    () =>
      todayAppointments
        .filter((a) => a.status === 'CONFIRMED')
        .sort((a, b) => new Date(`${a.appointmentDate}T${a.startTime}`).getTime() - new Date(`${b.appointmentDate}T${b.startTime}`).getTime()),
    [todayAppointments],
  );

  const pendingAppointments = useMemo(
    () =>
      todayAppointments
        .filter((a) => a.status === 'PENDING')
        .sort((a, b) => new Date(`${a.appointmentDate}T${a.startTime}`).getTime() - new Date(`${b.appointmentDate}T${b.startTime}`).getTime()),
    [todayAppointments],
  );

  const completedAppointments = useMemo(
    () => todayAppointments.filter((a) => a.status === 'COMPLETED').length,
    [todayAppointments],
  );

  const cancelledAppointments = useMemo(
    () => todayAppointments.filter((a) => a.status === 'CANCELLED' || a.status === 'REJECTED').length,
    [todayAppointments],
  );

  const nextAppointment = useMemo(() => {
    const now = new Date();
    return todayAppointments
      .filter((a) => ['PENDING', 'CONFIRMED'].includes(a.status))
      .map((a) => ({ ...a, startsAt: new Date(`${a.appointmentDate}T${a.startTime}`) }))
      .filter((a) => a.startsAt.getTime() >= now.getTime())
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0] || null;
  }, [todayAppointments]);

  const missingRequiredProfileFields = useMemo(() => {
    if (!doctor) {
      return [] as string[];
    }

    const requiredChecks: Array<{ label: string; valid: boolean }> = [
      { label: 'First name', valid: Boolean(doctor.firstName?.trim()) },
      { label: 'Last name', valid: Boolean(doctor.lastName?.trim()) },
      { label: 'Email', valid: Boolean(doctor.email?.trim()) },
      { label: 'Phone', valid: Boolean(doctor.phone?.trim()) },
      { label: 'Specialization', valid: Boolean(doctor.specialization?.trim()) },
      { label: 'Qualifications', valid: Boolean(doctor.qualifications?.trim()) },
      { label: 'Experience years', valid: Number(doctor.experienceYears) > 0 },
      { label: 'License number', valid: Boolean(doctor.licenseNumber?.trim()) },
    ];

    return requiredChecks.filter((item) => !item.valid).map((item) => item.label);
  }, [doctor]);

  const licenseAlert = useMemo(() => {
    if (!doctor?.licenseExpiryDate) {
      return null;
    }

    const expiry = new Date(doctor.licenseExpiryDate);
    if (Number.isNaN(expiry.getTime())) {
      return null;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const expiryStart = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
    const diffDays = Math.ceil((expiryStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `License expired ${Math.abs(diffDays)} day(s) ago`;
    }

    if (diffDays <= 30) {
      return `License expires in ${diffDays} day(s)`;
    }

    return null;
  }, [doctor?.licenseExpiryDate]);

  const criticalAlerts = useMemo(() => {
    const alerts: string[] = [];

    if (!doctor) {
      alerts.push('Doctor profile is not created yet. Complete profile setup to activate dashboard metrics.');
      return alerts;
    }

    if (licenseAlert) {
      alerts.push(licenseAlert);
    }

    if (missingRequiredProfileFields.length > 0) {
      alerts.push(`Missing required profile fields: ${missingRequiredProfileFields.slice(0, 2).join(', ')}${missingRequiredProfileFields.length > 2 ? '...' : ''}`);
    }

    return alerts;
  }, [licenseAlert, missingRequiredProfileFields]);

  const availableSlots = summary?.availableSlots || 0;
  const totalSlots = summary?.totalSlots || 0;
  const availableRatio = totalSlots > 0 ? Math.min(Math.max(Math.round((availableSlots / totalSlots) * 100), 0), 100) : 0;

  const liveQueue = todayAppointments
    .slice()
    .sort((a, b) => new Date(`${a.appointmentDate}T${a.startTime}`).getTime() - new Date(`${b.appointmentDate}T${b.startTime}`).getTime())
    .slice(0, 8)
    .map((app, index) => ({
      id: index + 1,
      patientName: `Patient #${app.patientId}`,
      time: formatTime(app.startTime),
      ageGender: '--',
      status: mapAppointmentToQueueStatus(app.status),
      reason: app.reasonForVisit || app.appointmentType,
    }));

  const visibleQueue = useMemo(() => {
    if (queueFilter === 'ALL') {
      return liveQueue;
    }
    return liveQueue.filter((row) => row.status === queueFilter);
  }, [liveQueue, queueFilter]);

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(36,159,159,0.2),transparent_44%),radial-gradient(circle_at_86%_16%,rgba(30,113,163,0.18),transparent_42%),linear-gradient(150deg,#edf7fb_0%,#f7fcff_52%,#edf6f2_100%)]" />
      <div className="absolute -left-24 top-44 h-72 w-72 rounded-full bg-teal-200/35 blur-3xl" />
      <div className="absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-cyan-200/35 blur-3xl" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative z-10 rounded-[2rem] border border-white/70 bg-white/65 p-5 shadow-[0_22px_70px_rgba(13,55,78,0.14)] backdrop-blur-xl sm:p-7"
      >
        <div className="mb-5 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
          <div className="relative overflow-hidden rounded-[1.6rem] border border-white/80 bg-gradient-to-br from-[#0f5f80] via-[#137793] to-[#17858a] p-5 text-white shadow-lg sm:p-6">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full border border-white/20" />
            <div className="absolute -bottom-14 right-24 h-40 w-40 rounded-full border border-white/15" />

            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">Doctor Landing</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                  {doctor?.firstName || authUser?.firstName ? `Welcome, Dr. ${doctor?.firstName || authUser?.firstName}` : 'Welcome, Doctor'}
                </h1>
                <p className="mt-2 text-sm text-cyan-100/95">
                  {todayDate} · {nowTime}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" className="rounded-full border border-white/40 bg-white/15 p-2 text-white/95 hover:bg-white/25">
                  <Bell className="h-4 w-4" />
                </button>
                <button type="button" className="rounded-full border border-white/40 bg-white/15 p-2 text-white/95 hover:bg-white/25">
                  <Mail className="h-4 w-4" />
                </button>
                <button type="button" className="rounded-full border border-white/40 bg-white/15 p-2 text-white/95 hover:bg-white/25">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="relative mt-5 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-white/25 bg-white/12 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-100">Verification</p>
                <p className="mt-1 text-sm font-bold">{summary?.verificationStatus || 'PENDING'}</p>
              </div>
              <div className="rounded-xl border border-white/25 bg-white/12 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-100">Specialty</p>
                <p className="mt-1 text-sm font-bold truncate">{doctor?.specialization || 'General Practice'}</p>
              </div>
              <div className="rounded-xl border border-white/25 bg-white/12 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-100">Availability</p>
                <p className="mt-1 text-sm font-bold">{availableSlots}/{totalSlots} open</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-slate-200 bg-white/85 p-4 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-700">Quick Actions</h2>
            <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs font-bold">
              <Link to={doctor ? `/doctors/${doctor.id}/availability` : '/doctors/profile/manage'} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-700 hover:bg-slate-100">
                <Calendar className="h-3.5 w-3.5" />
                Availability
              </Link>
              <Link to={doctor ? `/doctors/${doctor.id}/dashboard` : '/doctors/profile/manage'} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-700 hover:bg-slate-100">
                <Activity className="h-3.5 w-3.5" />
                Insights
              </Link>
              <Link to="/doctor/appointments" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-700 hover:bg-slate-100">
                <Video className="h-3.5 w-3.5" />
                Sessions
              </Link>
              <Link to="/doctors/profile/manage" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-700 hover:bg-slate-100">
                <Settings className="h-3.5 w-3.5" />
                Profile
              </Link>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Schedule Meter</p>
                <p className="text-xs font-black text-slate-700">{availableRatio}%</p>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-gradient-to-r from-teal-600 to-cyan-500" style={{ width: `${availableRatio}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">{availableSlots} slots available today</p>
            </div>
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5">
            <p className="text-xs font-semibold text-slate-500">Today Appointments</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{todayAppointments.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3.5">
            <p className="text-xs font-semibold text-slate-500">Pending</p>
            <p className="mt-1 text-2xl font-black text-amber-600">{pendingAppointments.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3.5">
            <p className="text-xs font-semibold text-slate-500">Confirmed</p>
            <p className="mt-1 text-2xl font-black text-emerald-600">{confirmedAppointments.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3.5">
            <p className="text-xs font-semibold text-slate-500">Completed</p>
            <p className="mt-1 text-2xl font-black text-blue-600">{completedAppointments}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3.5">
            <p className="text-xs font-semibold text-slate-500">No-show/Cancelled</p>
            <p className="mt-1 text-2xl font-black text-rose-600">{cancelledAppointments}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          <div className="rounded-[1.4rem] border border-slate-200 bg-white/90 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Today Queue</h3>
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 sm:flex">
                <Search className="h-3.5 w-3.5" />
                Quick search
              </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              {(['ALL', 'Waiting', 'Confirmed', 'Completed', 'Cancelled'] as const).map((filterValue) => (
                <button
                  key={filterValue}
                  type="button"
                  onClick={() => setQueueFilter(filterValue)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    queueFilter === filterValue
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filterValue}
                </button>
              ))}
              <button
                type="button"
                onClick={() => void loadDoctorData(true)}
                className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-100"
              >
                Refresh Now
              </button>
              {lastUpdatedAt && (
                <p className="text-[11px] text-slate-500">Updated {lastUpdatedAt.toLocaleTimeString()}</p>
              )}
            </div>

            {!doctor ? (
              <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-6">
                <h2 className="text-xl font-bold text-teal-900 mb-2">Profile Incomplete</h2>
                <p className="text-teal-700 mb-5">Complete your professional profile to start receiving active appointments.</p>
                <Link to="/doctors/profile/manage" className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white hover:bg-teal-700 transition-colors">
                  Complete Profile Setup
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="grid grid-cols-[38px_1.2fr_0.8fr_0.8fr_0.9fr_1fr] gap-2 border-b border-slate-200 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <span>#</span>
                  <span>Patient</span>
                  <span>Time</span>
                  <span>Age/Gender</span>
                  <span>Status</span>
                  <span>Reason</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {!visibleQueue.length && (
                    <div className="px-3 py-6 text-sm text-slate-500">
                      No appointments found for this filter.
                    </div>
                  )}
                  {visibleQueue.map((row) => (
                    <div key={`${row.id}-${row.patientName}`} className="grid grid-cols-[38px_1.2fr_0.8fr_0.8fr_0.9fr_1fr] items-center gap-2 px-3 py-3 text-sm text-slate-700">
                      <p className="text-xs font-semibold text-slate-500">{row.id}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                          <UserCircle className="h-5 w-5" />
                        </div>
                        <p className="truncate text-xs font-semibold sm:text-sm">{row.patientName}</p>
                      </div>
                      <p className="text-xs sm:text-sm">{row.time}</p>
                      <p className="text-xs sm:text-sm">{row.ageGender}</p>
                      <span className={`inline-flex w-fit rounded-full px-2 py-1 text-[11px] font-bold ${getQueueStatusStyles(row.status)}`}>
                        {row.status}
                      </span>
                      <p className="text-xs sm:text-sm">{row.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.4rem] border border-slate-200 bg-white/90 p-4">
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Urgent Focus</h3>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p className="rounded-lg border border-slate-200 bg-white p-2.5">Pending approvals: <span className="font-bold text-amber-700">{pendingAppointments.length}</span></p>
                <p className="rounded-lg border border-slate-200 bg-white p-2.5">Next appointment: <span className="font-bold text-slate-900">{nextAppointment ? formatTime(nextAppointment.startTime) : 'None today'}</span></p>
                <p className="rounded-lg border border-slate-200 bg-white p-2.5">Profile completeness: <span className="font-bold text-teal-700">{summary?.profileCompletenessScore || 0}%</span></p>
                {criticalAlerts.length > 0 ? (
                  criticalAlerts.slice(0, 2).map((alert, index) => (
                    <p key={`${alert}-${index}`} className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-rose-800">
                      Alert: <span className="font-semibold">{alert}</span>
                    </p>
                  ))
                ) : (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-800">No critical alerts.</p>
                )}
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-slate-200 bg-white/90 p-4">
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Clinic Snapshot</h3>
              <div className="mt-3 space-y-2.5 text-sm">
                <p className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-700">
                  <MapPin className="mr-1 inline h-3.5 w-3.5" />
                  {doctor?.clinicLocations?.split(',')[0] || 'Clinic location not set'}
                </p>
                <p className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-700">
                  <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
                  {doctor?.active ? 'Public profile is active' : 'Public profile is inactive'}
                </p>
                <Link to="/doctor/appointments" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-teal-700">
                  <CalendarRange className="h-3.5 w-3.5" />
                  Manage Today Appointments
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[1.4rem] border border-slate-200 bg-white/90 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Upcoming Timeline</h3>
            <Link to="/doctor/appointments" className="text-xs font-semibold text-teal-700 hover:text-teal-800">View all</Link>
          </div>

          {!doctor ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Complete your doctor profile to start seeing upcoming timeline data.
            </div>
          ) : todayAppointments.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming appointments for today.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {todayAppointments
                .slice()
                .sort((a, b) => new Date(`${a.appointmentDate}T${a.startTime}`).getTime() - new Date(`${b.appointmentDate}T${b.startTime}`).getTime())
                .slice(0, 6)
                .map((appointment) => (
                  <div key={appointment.id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-sm font-semibold text-slate-800">Patient #{appointment.patientId}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatTime(appointment.startTime)} · {appointment.appointmentType}</p>
                    <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${appointment.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : appointment.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {appointment.status}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}

function AdminDashboardView() {
  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Admin Governance Panel</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Verification and compliance tools for doctor-service management.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="inline-flex rounded-xl bg-gradient-to-r from-slate-800 to-slate-600 p-2 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Doctor Verification</h2>
          <p className="mt-2 text-sm text-slate-600">
            Review verification status changes and track verification history for governance workflows.
          </p>
          <Link
            to="/doctors/admin/verification"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Open Verification Tools
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="inline-flex rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 p-2 text-white">
            <Settings className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Doctor Operations</h2>
          <p className="mt-2 text-sm text-slate-600">
            Access operational doctor tools for profile management and support tasks when required.
          </p>
          <Link
            to="/doctors/profile"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Open Doctor Profile Tools
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const role = getAuthUserRole();

  return (
    <div className="min-h-screen pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto">
        {role === 'DOCTOR' ? (
          <DoctorDashboardView />
        ) : role === 'ADMIN' ? (
          <AdminDashboardView />
        ) : (
          <PatientDashboardPage />
        )}
      </div>
    </div>
  );
}
