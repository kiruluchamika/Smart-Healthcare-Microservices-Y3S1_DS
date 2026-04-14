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
    <div className="min-h-screen bg-slate-50 relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 lg:px-8 text-slate-900 font-sans selection:bg-teal-500/30">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-200/40 rounded-full blur-[120px] pointer-events-none opacity-60" />
      <div className="absolute bottom-0 left-[-10%] w-[600px] h-[600px] bg-blue-200/30 rounded-full blur-[100px] pointer-events-none opacity-60" />

      <div className="relative z-10 mx-auto max-w-6xl">
        {loading && <div className="h-96 animate-pulse rounded-[2.5rem] border border-white bg-white/60 backdrop-blur-md shadow-sm" />}

        {!loading && error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[2rem] border border-rose-200 bg-rose-50/80 backdrop-blur-sm p-6 text-sm font-semibold text-rose-700 shadow-sm">
             {error}
          </motion.div>
        )}

        {!loading && !error && doctor && (
          <div className="space-y-8">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden rounded-[2.5rem] border border-white bg-white/70 p-8 sm:p-12 shadow-xl shadow-teal-900/[0.04] backdrop-blur-xl"
            >
              <div className="pointer-events-none absolute -right-24 -top-20 h-96 w-96 rounded-full bg-gradient-to-br from-teal-200/50 to-blue-200/50 blur-[80px]" />
              
              <div className="relative grid gap-8 md:grid-cols-[1.3fr_0.7fr]">
                <div>
                  <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
                    {doctor.profilePictureUrl ? (
                       <img src={doctor.profilePictureUrl} alt={`Dr. ${doctor.lastName}`} className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-lg" />
                    ) : (
                       <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-black text-3xl shadow-lg border-4 border-white">
                         {doctor.firstName.charAt(0)}{doctor.lastName.charAt(0)}
                       </div>
                    )}
                    <div className="pt-2">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-teal-100 shadow-sm">
                         <CircleUserRound className="h-4 w-4 text-teal-600" />
                         <span className="text-xs font-bold uppercase tracking-widest text-teal-700">Verified Specialist</span>
                      </div>
                    </div>
                  </div>
                  
                  <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl drop-shadow-sm">
                    Dr. {doctor.firstName} {doctor.lastName}
                  </h1>
                  <p className="mt-3 text-xl font-medium text-teal-600/90">{doctor.specialization}</p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <DoctorStatusBadge status={doctor.verificationStatus} />
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold shadow-sm border ${doctor.active ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      <span className={`w-2 h-2 rounded-full ${doctor.active ? 'bg-teal-500 animate-pulse' : 'bg-slate-400'}`}></span>
                      {doctor.active ? 'Profile Active' : 'Profile Inactive'}
                    </span>
                  </div>

                  <div className="mt-8 rounded-3xl bg-white/50 border border-white p-6 shadow-sm">
                    <p className="text-base leading-relaxed text-slate-700">{doctor.bio || 'This specialist has not provided a detailed biography yet.'}</p>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-white bg-white/60 p-5 shadow-[0_4px_15px_rgb(0,0,0,0.02)] transition-all hover:shadow-md hover:-translate-y-1 duration-300">
                      <p className="text-xs font-bold uppercase tracking-widest text-teal-600/70 mb-2">Qualifications</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800 leading-snug">{doctor.qualifications || 'Not provided'}</p>
                    </div>
                    <div className="rounded-3xl border border-white bg-white/60 p-5 shadow-[0_4px_15px_rgb(0,0,0,0.02)] transition-all hover:shadow-md hover:-translate-y-1 duration-300">
                      <p className="text-xs font-bold uppercase tracking-widest text-teal-600/70 mb-2">Board Certifications</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800 leading-snug">{doctor.boardCertifications || 'Not provided'}</p>
                    </div>
                    <div className="rounded-3xl border border-white bg-white/60 p-5 shadow-[0_4px_15px_rgb(0,0,0,0.02)] transition-all hover:shadow-md hover:-translate-y-1 duration-300 sm:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-teal-600/70 mb-3">Languages Spoken</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {splitValues(doctor.languagesSpoken).length > 0 ? (
                          splitValues(doctor.languagesSpoken).map((language) => (
                            <span key={language} className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-700 border border-slate-200/60 shadow-sm">
                              {language}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm font-semibold text-slate-500">Not provided</p>
                        )}
                      </div>
                    </div>
                    <div className="rounded-3xl border border-white bg-white/60 p-5 shadow-[0_4px_15px_rgb(0,0,0,0.02)] transition-all hover:shadow-md hover:-translate-y-1 duration-300 sm:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-teal-600/70 mb-2">Clinic Locations</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{doctor.clinicLocations || 'Not provided'}</p>
                    </div>
                    <div className="rounded-3xl border border-white bg-white/60 p-5 shadow-[0_4px_15px_rgb(0,0,0,0.02)] transition-all hover:shadow-md hover:-translate-y-1 duration-300 sm:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-teal-600/70 mb-2">Insurance Networks</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{doctor.insuranceProviders || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="mt-10 flex flex-wrap gap-4">
                    <Link
                      to="/appointments/book"
                      className="rounded-2xl bg-teal-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-teal-600/30 transition-all hover:bg-teal-700 hover:shadow-teal-600/50 hover:-translate-y-0.5"
                    >
                      Book Appointment
                    </Link>
                    <Link
                      to="/doctors"
                      className="rounded-2xl border border-teal-200 bg-white px-8 py-4 text-sm font-bold text-teal-700 shadow-sm transition-all hover:bg-teal-50 hover:shadow-md hover:-translate-y-0.5"
                    >
                      Back to Directory
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1 place-content-start">
                  {[
                     { icon: CircleUserRound, label: 'Clinical Experience', value: `${doctor.experienceYears} Years`, color: 'teal' },
                     { icon: ShieldCheck, label: 'Medical License', value: doctor.licenseNumber, color: 'blue' },
                     { icon: Phone, label: 'Contact Information', value: doctor.phone, subValue: doctor.email, color: 'indigo' },
                     { icon: ClipboardCheck, label: 'Profile Trust Score', value: `${doctor.profileCompletenessScore}%`, color: 'emerald' },
                  ].map((item, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      className="group rounded-3xl border border-white bg-white/60 p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:bg-white/80"
                    >
                      <div className={`mb-3 inline-flex items-center justify-center p-3 rounded-2xl bg-${item.color}-50 text-${item.color}-600 group-hover:scale-110 transition-transform`}>
                        <item.icon className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{item.label}</p>
                      <p className="text-lg font-black text-slate-900">{item.value}</p>
                      {item.subValue && <p className="text-xs font-semibold text-slate-500 mt-1">{item.subValue}</p>}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>

            <div className="grid gap-8 lg:grid-cols-2">
              <motion.section 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-[2.5rem] border border-white bg-white/70 p-8 shadow-xl shadow-teal-900/[0.04] backdrop-blur-xl"
              >
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
                      <CalendarDays className="h-6 w-6" />
                   </div>
                   <h2 className="text-2xl font-black text-slate-900">Availability Snapshot</h2>
                 </div>
                {availability.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white/40 p-8 text-center">
                     <p className="text-sm font-semibold text-slate-600 mb-1">No active slots available.</p>
                     <p className="text-xs text-slate-500">The doctor has not configured their working hours yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availability.slice(0, 6).map((slot) => (
                      <div key={slot.id} className="group relative overflow-hidden rounded-2xl border border-white bg-white/50 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:bg-white/80 hover:-translate-y-0.5">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="font-bold text-slate-800 text-sm mb-1">
                          {formatDayOfWeek(slot.dayOfWeek)} <span className="text-teal-600 mx-1">•</span> {formatTime(slot.startTime)} to {formatTime(slot.endTime)}
                        </p>
                        <p className="text-xs font-medium text-slate-500">
                          Valid: {formatDate(slot.effectiveFrom)} to {formatDate(slot.effectiveTo)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>

              <motion.section 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="rounded-[2.5rem] border border-white bg-gradient-to-b from-teal-50/50 to-white/70 p-8 shadow-xl shadow-teal-900/[0.04] backdrop-blur-xl flex flex-col"
              >
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                      <Activity className="h-6 w-6" />
                   </div>
                   <h2 className="text-2xl font-black text-slate-900">Practice Overview</h2>
                 </div>
                {summary ? (
                  <div className="space-y-6 flex-grow flex flex-col">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-widest text-teal-600/70 mb-2">Total Schedule</p>
                        <p className="text-4xl font-black text-slate-900">{summary.totalSlots}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">Slots managed</p>
                      </div>
                      <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-widest text-teal-600/70 mb-2">Open For Booking</p>
                        <p className="text-4xl font-black text-teal-600">{summary.availableSlots}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">Slots available</p>
                      </div>
                    </div>
                    <div className="flex-grow rounded-3xl border border-white bg-white/60 p-6 shadow-sm">
                      <p className="text-sm font-bold text-slate-800 mb-2">System Insight</p>
                      <p className="text-sm leading-relaxed text-slate-600">{summary.profileInsight}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-grow rounded-3xl border border-dashed border-slate-300 bg-white/40 p-8 flex items-center justify-center text-center">
                     <div>
                       <p className="text-sm font-semibold text-slate-600 mb-1">Metrics unavailable</p>
                       <p className="text-xs text-slate-500">Not enough data to generate practice overview.</p>
                     </div>
                  </div>
                )}
              </motion.section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
