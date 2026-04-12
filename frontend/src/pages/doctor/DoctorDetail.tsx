import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, CalendarDays, CircleUserRound, ClipboardCheck, Phone, ShieldCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { DoctorStatusBadge } from '../../components/doctor/DoctorStatusBadge';
import { getAvailability, getDashboardSummary, getDoctorById } from '../../services/doctor/doctorApi';
import type { DoctorAvailability, DoctorDashboardSummary, DoctorServiceDoctor } from '../../types/doctor';
import { formatDate, formatDayOfWeek, formatTime } from '../../utils/doctor/doctorFormatters';

function splitValues(value?: string | null) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function DoctorDetail() {
  const params = useParams();
  const doctorId = Number(params.id || 0);

  const [doctor, setDoctor] = useState<DoctorServiceDoctor | null>(null);
  const [availability, setAvailability] = useState<DoctorAvailability[]>([]);
  const [summary, setSummary] = useState<DoctorDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!doctorId) {
        setError('Invalid doctor id.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [doctorRes, availabilityRes, summaryRes] = await Promise.all([
          getDoctorById(doctorId),
          getAvailability(doctorId),
          getDashboardSummary(doctorId),
        ]);

        setDoctor(doctorRes);
        setAvailability(availabilityRes);
        setSummary(summaryRes);
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'Failed to load doctor details.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [doctorId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {loading && <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">{error}</div>
        )}

        {!loading && !error && doctor && (
          <>
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="pointer-events-none absolute -right-24 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-emerald-200/60 to-amber-200/60 blur-3xl" />
              <div className="relative grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Doctor Profile</p>
                  <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                    Dr. {doctor.firstName} {doctor.lastName}
                  </h1>
                  <p className="mt-2 text-sm text-slate-600">{doctor.specialization}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <DoctorStatusBadge status={doctor.verificationStatus} />
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${doctor.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {doctor.active ? 'Active profile' : 'Inactive profile'}
                    </span>
                  </div>

                  <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-700">{doctor.bio || 'No biography available.'}</p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Board certifications</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{doctor.boardCertifications || 'Not provided'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">License expiry</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {doctor.licenseExpiryDate ? new Date(doctor.licenseExpiryDate).toLocaleDateString() : 'Not provided'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Languages spoken</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {splitValues(doctor.languagesSpoken).length > 0 ? (
                          splitValues(doctor.languagesSpoken).map((language) => (
                            <span key={language} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                              {language}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm font-semibold text-slate-800">Not provided</p>
                        )}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Clinic locations</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{doctor.clinicLocations || 'Not provided'}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Insurance providers</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{doctor.insuranceProviders || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <Link
                      to="/appointments/book"
                      className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Book appointment
                    </Link>
                    <Link
                      to="/doctors"
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Back to directory
                    </Link>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <CircleUserRound className="mb-2 h-5 w-5 text-emerald-600" />
                    <p className="text-xs font-semibold text-slate-500">Experience</p>
                    <p className="text-lg font-bold text-slate-900">{doctor.experienceYears} years</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <ShieldCheck className="mb-2 h-5 w-5 text-emerald-600" />
                    <p className="text-xs font-semibold text-slate-500">License</p>
                    <p className="text-lg font-bold text-slate-900">{doctor.licenseNumber}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <Phone className="mb-2 h-5 w-5 text-emerald-600" />
                    <p className="text-xs font-semibold text-slate-500">Contact</p>
                    <p className="text-sm font-semibold text-slate-900">{doctor.phone}</p>
                    <p className="text-xs text-slate-600">{doctor.email}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <ClipboardCheck className="mb-2 h-5 w-5 text-emerald-600" />
                    <p className="text-xs font-semibold text-slate-500">Completeness</p>
                    <p className="text-lg font-bold text-slate-900">{doctor.profileCompletenessScore}%</p>
                    <p className="text-xs text-slate-600">{doctor.onboardingState}</p>
                  </div>
                </div>
              </div>
            </motion.section>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
                  <CalendarDays className="h-5 w-5 text-emerald-600" />
                  Availability Snapshot
                </h2>
                {availability.length === 0 ? (
                  <p className="text-sm text-slate-600">No slots configured yet.</p>
                ) : (
                  <div className="space-y-2">
                    {availability.slice(0, 6).map((slot) => (
                      <div key={slot.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        <p className="font-semibold">
                          {formatDayOfWeek(slot.dayOfWeek)} {formatTime(slot.startTime)} to {formatTime(slot.endTime)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Effective {formatDate(slot.effectiveFrom)} to {formatDate(slot.effectiveTo)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Activity className="h-5 w-5 text-emerald-600" />
                  Dashboard Insight
                </h2>
                {summary ? (
                  <div className="space-y-3 text-sm text-slate-700">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-emerald-50 p-3">
                        <p className="text-xs text-emerald-700">Total slots</p>
                        <p className="text-xl font-bold text-slate-900">{summary.totalSlots}</p>
                      </div>
                      <div className="rounded-xl bg-amber-50 p-3">
                        <p className="text-xs text-amber-700">Available slots</p>
                        <p className="text-xl font-bold text-slate-900">{summary.availableSlots}</p>
                      </div>
                    </div>
                    <p>{summary.profileInsight}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">No summary available.</p>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
