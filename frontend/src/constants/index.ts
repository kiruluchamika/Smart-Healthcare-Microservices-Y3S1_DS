export const APP_NAME = 'Clinexa';
export const APP_DESCRIPTION = 'AI-Powered Smart Healthcare Platform';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN_ROOT: '/admin',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_VERIFICATION: '/admin/verification',
  DASHBOARD: '/dashboard',
  APPOINTMENTS: '/appointments',
  APPOINTMENT_BOOKING: '/appointments/book',
  DOCTOR_APPOINTMENTS: '/doctor/appointments',
  CONSULTATION: '/consultation/:id',
  PROFILE: '/profile',
  DOCTORS: '/doctors',
  DOCTOR_DETAIL: '/doctors/:id',
  DOCTOR_PROFILE: '/doctors/profile',
  DOCTOR_AVAILABILITY: '/doctors/:id/availability',
  DOCTOR_DASHBOARD: '/doctors/:id/dashboard',
  DOCTOR_VERIFICATION_ADMIN: '/doctors/admin/verification',
};

export const TIME_SLOTS = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
];

export const SPECIALTIES = [
  'General Practitioner',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Ophthalmologist',
  'Orthopedist',
  'Pediatrician',
  'Psychiatrist',
  'Urologist',
  'Gynecologist',
];

export const APPOINTMENT_TYPES = [
  { label: 'Video Consultation', value: 'video' },
  { label: 'In-Person Visit', value: 'in-person' },
];

export const HEALTH_METRICS = [
  { label: 'Heart Rate', unit: 'bpm', icon: 'heart' },
  { label: 'Blood Pressure', unit: 'mmHg', icon: 'pressure' },
  { label: 'Temperature', unit: '°F', icon: 'thermometer' },
  { label: 'Blood Sugar', unit: 'mg/dL', icon: 'droplet' },
  { label: 'Weight', unit: 'lbs', icon: 'weight' },
  { label: 'Steps', unit: 'steps', icon: 'activity' },
];

export {
  DOCTOR_DAYS,
  DOCTOR_SORT_FIELDS,
  DOCTOR_VERIFICATION_STATUSES,
} from './doctor';
