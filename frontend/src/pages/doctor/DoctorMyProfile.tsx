import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock3, FileCheck2, ShieldX, Stethoscope } from 'lucide-react';
import { getDoctorByEmail, getDoctorById } from '../../services/doctor/doctorApi';
import { getAuthUser } from '../../services/authSession';
import type { DoctorServiceDoctor } from '../../types/doctor';

const DOCTOR_PROFILE_ID_KEY = 'doctorProfileId';

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
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-teal-50 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="h-64 animate-pulse rounded-3xl border border-slate-200 bg-white" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-teal-50 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-teal-50 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-black text-slate-900">Create Your Doctor Profile</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your account is ready. Create your professional profile so admin can verify and approve you.
          </p>
          <Link
            to="/doctors/profile/manage"
            className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-orange-500 to-teal-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Open profile form
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-teal-50 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="bg-[linear-gradient(120deg,#f97316_0%,#0d9488_100%)] p-6 text-white sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  <Stethoscope className="h-3.5 w-3.5" />
                  My Doctor Profile
                </p>
                <h1 className="mt-3 text-2xl font-black sm:text-3xl">Dr. {fullName}</h1>
                <p className="mt-2 text-sm text-white/90">{doctor.specialization}</p>
              </div>

              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(doctor.verificationStatus)}`}>
                {getStatusIcon(doctor.verificationStatus)}
                {doctor.verificationStatus}
              </span>
            </div>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{doctor.email}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{doctor.phone}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Qualifications</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{doctor.qualifications}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Experience</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{doctor.experienceYears} years</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">License Number</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{doctor.licenseNumber}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile Completion</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{doctor.profileCompletenessScore}%</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bio</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{doctor.bio || 'No bio added yet.'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-slate-200 bg-slate-50 p-6 sm:p-8">
            <Link
              to="/doctors/profile/manage"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              <FileCheck2 className="h-4 w-4" />
              Edit Profile
            </Link>
            <Link
              to={`/doctors/${doctor.id}/availability`}
              className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Manage Availability
            </Link>
            <Link
              to={`/doctors/${doctor.id}/dashboard`}
              className="inline-flex rounded-xl bg-gradient-to-r from-orange-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Open Doctor Dashboard
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
