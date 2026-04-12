import type {
  AppointmentBookingDoctor,
  DoctorServiceDoctor,
  DoctorVerificationStatus,
} from '../../types/doctor';

export function getDoctorFullName(doctor?: Pick<DoctorServiceDoctor, 'firstName' | 'lastName'> | null) {
  if (!doctor) {
    return '';
  }

  return `Dr. ${doctor.firstName} ${doctor.lastName}`.trim();
}

export function getDoctorInitials(doctor: Pick<DoctorServiceDoctor, 'firstName' | 'lastName'>) {
  const firstInitial = doctor.firstName?.charAt(0) || '';
  const lastInitial = doctor.lastName?.charAt(0) || '';
  return `${firstInitial}${lastInitial}`.toUpperCase() || 'DR';
}

export function getPrimaryClinicLocation(value?: string | null) {
  const locations = splitValues(value);
  return locations[0] || 'Clinic location not specified';
}

export function toAppointmentBookingDoctor(doctor: DoctorServiceDoctor): AppointmentBookingDoctor {
  const hasCustomFee = doctor.consultationFee !== null && doctor.consultationFee !== undefined && doctor.consultationFee !== '';
  const pricingLabel = hasCustomFee
    ? `Doctor price: USD ${doctor.consultationFee}`
    : 'Fixed channeling price applies (USD 15 video / USD 20 physical)';

  return {
    id: doctor.id,
    fullName: getDoctorFullName(doctor),
    specialty: doctor.specialization,
    qualifications: doctor.qualifications,
    experienceYears: doctor.experienceYears,
    location: getPrimaryClinicLocation(doctor.clinicLocations),
    availabilityLabel: doctor.active ? 'Availability from live schedule' : 'Currently unavailable',
    consultationFee: doctor.consultationFee,
    pricingLabel,
    profileCompletenessScore: doctor.profileCompletenessScore,
    initials: getDoctorInitials(doctor),
  };
}

function splitValues(value?: string | null) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatDayOfWeek(day: string) {
  const normalized = day.toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function formatTime(value: string) {
  if (!value) {
    return '--';
  }

  const parts = value.split(':');
  if (parts.length < 2) {
    return value;
  }

  const hour = Number(parts[0]);
  const minute = parts[1];
  const meridiem = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;

  return `${hour12}:${minute} ${meridiem}`;
}

export function formatDate(value?: string) {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getVerificationTone(status: DoctorVerificationStatus) {
  if (status === 'APPROVED') {
    return {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      ring: 'ring-emerald-200',
    };
  }

  if (status === 'REJECTED') {
    return {
      bg: 'bg-rose-100',
      text: 'text-rose-700',
      ring: 'ring-rose-200',
    };
  }

  return {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    ring: 'ring-amber-200',
  };
}
