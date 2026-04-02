export const DOCTOR_DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export const DOCTOR_VERIFICATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

export const DOCTOR_SORT_FIELDS = [
  { label: 'Created Date', value: 'createdAt' },
  { label: 'Experience', value: 'experienceYears' },
  { label: 'First Name', value: 'firstName' },
  { label: 'Specialization', value: 'specialization' },
];
