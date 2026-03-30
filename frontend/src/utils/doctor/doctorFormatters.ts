import type { DoctorVerificationStatus } from '../../types/doctor';

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
