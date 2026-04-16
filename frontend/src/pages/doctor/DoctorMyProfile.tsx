import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock3, FileCheck2, ShieldX, Stethoscope } from 'lucide-react';
import { DoctorTopNav } from '../../components/doctor/DoctorTopNav';
import { getDoctorByEmail, getDoctorById } from '../../services/doctor/doctorApi';
import { getAuthUser } from '../../services/authSession';
import type { DoctorServiceDoctor } from '../../types/doctor';

const DOCTOR_PROFILE_ID_KEY = 'doctorProfileId';

function splitValues(value?: string | null) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getStatusStyle(status: DoctorServiceDoctor['verificationStatus']) {
  if (status === 'APPROVED') {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }

  if (status === 'REJECTED') {
    return 'bg-rose-100 text-rose-700 border-rose-200';
  }

  return 'bg-amber-100 text-amber-700 border-amber-200';
}

function getStatusIcon(status: DoctorServiceDoctor['verificationStatus']) {
  if (status === 'APPROVED') {
    return <CheckCircle2 className="h-4 w-4" />;
  }

  if (status === 'REJECTED') {
    return <ShieldX className="h-4 w-4" />;
  }

  return <Clock3 className="h-4 w-4" />;
}

export default function DoctorMyProfile() {
  const [doctor, setDoctor] = useState<DoctorServiceDoctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOwnProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const authUser = getAuthUser();
        if (!authUser?.email) {
          setError('Unable to determine logged-in doctor account.');
          return;
        }

        try {
          const byEmail = await getDoctorByEmail(authUser.email);
          setDoctor(byEmail);
          localStorage.setItem(DOCTOR_PROFILE_ID_KEY, String(byEmail.id));
          return;
        } catch {
          const rawStoredId = localStorage.getItem(DOCTOR_PROFILE_ID_KEY);
          const storedId = rawStoredId ? Number(rawStoredId) : 0;
          if (storedId > 0) {
            const byId = await getDoctorById(storedId);
            setDoctor(byId);
            return;
          }
        }

        setDoctor(null);
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'Unable to load doctor profile.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadOwnProfile();
  }, []);

  const fullName = useMemo(() => {
    if (!doctor) {
      return '';
    }

    return `${doctor.firstName} ${doctor.lastName}`.trim();
  }, [doctor]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="h-96 animate-pulse rounded-[2.5rem] border border-white bg-white/60 shadow-sm backdrop-blur-md" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-28 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-200 bg-rose-50/80 p-8 backdrop-blur-sm shadow-sm relative z-10">
          <p className="text-sm font-semibold text-rose-700 text-center">{error}</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-28 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-teal-200/40 rounded-full blur-[100px] pointer-events-none opacity-50" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl rounded-[2.5rem] border border-white bg-white/70 p-12 shadow-xl backdrop-blur-xl relative z-10 text-center"
        >
          <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Stethoscope className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3">Create Your Profile</h1>
          <p className="text-base text-slate-600 mb-8 max-w-md mx-auto">
            Your account is ready. Create your professional profile so our medical board can verify and approve you for appointments.
          </p>
          <Link
            to="/doctors/profile/manage"
            className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-teal-600/30 transition-all hover:bg-teal-700 hover:shadow-teal-600/50 hover:-translate-y-0.5"
          >
            Open Profile Form
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 lg:px-8 text-slate-900 font-sans selection:bg-teal-500/30">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-200/40 rounded-full blur-[120px] pointer-events-none opacity-60" />
      <div className="absolute bottom-0 left-[-10%] w-[600px] h-[600px] bg-blue-200/30 rounded-full blur-[100px] pointer-events-none opacity-60" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <DoctorTopNav doctorId={doctor.id} />
        
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="overflow-hidden rounded-[2.5rem] border border-white bg-white/70 shadow-xl backdrop-blur-xl"
        >
          <div className="relative bg-teal-600 p-8 sm:p-12 text-white overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bottom-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-teal-500 rounded-full blur-[50px] mix-blend-screen opacity-50" />
            <div className="absolute top-[-10%] right-[10%] w-32 h-32 bg-white/20 rounded-full blur-[30px]" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-10">
              {doctor.profilePictureUrl ? (
                 <div className="w-32 h-32 rounded-full border-4 border-white/30 shadow-xl overflow-hidden shrink-0">
                    <img src={doctor.profilePictureUrl} alt={`Dr. ${fullName}`} className="w-full h-full object-cover" />
                 </div>
              ) : (
                 <div className="w-32 h-32 rounded-full border-4 border-white/30 shadow-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-12 h-12 text-white/70" />
                 </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-6 flex-grow text-center md:text-left">
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-teal-50 shadow-sm mx-auto md:mx-0">
                    <Stethoscope className="h-4 w-4" />
                    My Professional Profile
                  </p>
                  <h1 className="mt-5 text-4xl font-black sm:text-5xl tracking-tight text-white drop-shadow-sm">Dr. {fullName}</h1>
                  <p className="mt-2 text-lg font-medium text-teal-50">{doctor.specialization}</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[140px] shadow-sm transform hover:scale-105 transition-transform duration-300 mx-auto md:mx-0">
                   <div className="bg-white rounded-full p-2 mb-2 text-teal-600">
                      {getStatusIcon(doctor.verificationStatus)}
                   </div>
                   <span className="text-xs font-bold tracking-widest uppercase text-white drop-shadow-md">
                     {doctor.verificationStatus}
                   </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-8 sm:grid-cols-2 lg:grid-cols-3 sm:p-10">
            {[
              { label: 'Email', value: doctor.email, full: false },
              { label: 'Phone', value: doctor.phone, full: false },
              { label: 'Experience & Board', value: `${doctor.experienceYears} years • ${doctor.boardCertifications || 'Pending'}`, full: false },
              { label: 'Qualifications', value: doctor.qualifications, full: true },
              { label: 'License Number', value: doctor.licenseNumber, full: false },
              { label: 'License Expiry', value: doctor.licenseExpiryDate ? new Date(doctor.licenseExpiryDate).toLocaleDateString() : 'Not set', full: false },
            ].map((item, idx) => (
              <motion.div 
                key={idx} 
                whileHover={{ y: -2 }}
                className={`rounded-3xl border border-white bg-white/50 p-5 shadow-[0_4px_15px_rgb(0,0,0,0.02)] transition-all duration-300 ${item.full ? 'sm:col-span-2 lg:col-span-3' : ''}`}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-teal-600/70 mb-2">{item.label}</p>
                <p className="text-base font-semibold text-slate-800 leading-snug">{item.value}</p>
              </motion.div>
            ))}
            
            <motion.div whileHover={{ y: -2 }} className="rounded-3xl border border-white bg-white/50 p-5 shadow-[0_4px_15px_rgb(0,0,0,0.02)] transition-all sm:col-span-2 lg:col-span-3">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-600/70 mb-3">Languages Spoken</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {splitValues(doctor.languagesSpoken).length > 0 ? (
                  splitValues(doctor.languagesSpoken).map((language) => (
                    <span key={language} className="rounded-xl border border-slate-200/60 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
                      {language}
                    </span>
                  ))
                ) : (
                  <p className="text-sm font-semibold text-slate-500">Not added yet.</p>
                )}
              </div>
            </motion.div>

            {[
              { label: 'Clinic Locations', value: doctor.clinicLocations },
              { label: 'Insurance Providers', value: doctor.insuranceProviders },
            ].map((item, idx) => (
               <motion.div 
                 key={idx} 
                 whileHover={{ y: -2 }}
                 className="rounded-3xl border border-white bg-white/50 p-5 shadow-[0_4px_15px_rgb(0,0,0,0.02)] transition-all sm:col-span-2 lg:col-span-3"
               >
                 <p className="text-xs font-bold uppercase tracking-widest text-teal-600/70 mb-2">{item.label}</p>
                 <p className="text-base font-semibold text-slate-800 leading-snug">{item.value || 'Not added yet.'}</p>
               </motion.div>
            ))}

            <motion.div whileHover={{ y: -2 }} className="rounded-3xl border border-white bg-white/50 p-5 shadow-[0_4px_15px_rgb(0,0,0,0.02)] transition-all sm:col-span-2 lg:col-span-3">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-600/70 mb-2">Detailed Biography</p>
              <p className="text-base leading-relaxed text-slate-700">{doctor.bio || 'No bio added yet.'}</p>
            </motion.div>
          </div>        </motion.section>
      </div>
    </div>
  );
}
