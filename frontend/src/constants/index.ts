export const APP_NAME = 'Clinexa';
export const APP_DESCRIPTION = 'AI-Powered Smart Healthcare Platform';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  APPOINTMENTS: '/appointments',
  CONSULTATION: '/consultation/:id',
  PROFILE: '/profile',
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
