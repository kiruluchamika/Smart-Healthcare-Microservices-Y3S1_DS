import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Clock3, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DoctorServiceDoctor } from '../../types/doctor';
import { DoctorStatusBadge } from './DoctorStatusBadge';

interface DoctorCardProps {
  doctor: DoctorServiceDoctor;
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-teal-100 bg-white p-5 shadow-sm transition-all hover:shadow-lg"
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-gradient-to-br from-teal-200/60 to-orange-200/60 blur-2xl" />

      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Dr. {doctor.firstName} {doctor.lastName}
            </h3>
            <p className="mt-1 text-sm text-slate-600">{doctor.specialization}</p>
          </div>
          <DoctorStatusBadge status={doctor.verificationStatus} />
        </div>

        <div className="mb-4 grid gap-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-teal-600" />
            <span>{doctor.experienceYears} years experience</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-teal-600" />
            <span>{doctor.licenseNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-teal-600" />
            <span>Profile score {doctor.profileCompletenessScore}%</span>
          </div>
        </div>

        <p className="line-clamp-2 text-sm text-slate-700">{doctor.bio || 'No biography provided yet.'}</p>

        <div className="mt-5 flex items-center justify-between">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${doctor.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {doctor.active ? 'Active' : 'Inactive'}
          </span>
          <Link
            to={`/doctors/${doctor.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition-colors hover:text-teal-500"
          >
            View profile
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
