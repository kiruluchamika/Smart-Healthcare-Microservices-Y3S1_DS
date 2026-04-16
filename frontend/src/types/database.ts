export type UserType = 'patient' | 'doctor' | 'admin';
export type AppointmentType = 'video' | 'in-person';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';
export type RecordType = 'lab_report' | 'prescription' | 'diagnosis' | 'vaccination' | 'other';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  user_type: UserType;
  profile_picture_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  specialty: string;
  license_number: string;
  rating: number;
  total_reviews: number;
  location?: string;
  hourly_rate: number;
  bio?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  users?: User;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  doctors?: Doctor;
  users?: User;
}

export interface Consultation {
  id: string;
  appointment_id: string;
  started_at: string;
  ended_at?: string;
  duration_minutes?: number;
  notes?: string;
  recording_url?: string;
  created_at: string;
}

export interface HealthRecord {
  id: string;
  patient_id: string;
  record_type: RecordType;
  description?: string;
  file_url?: string;
  recorded_date: string;
  created_at: string;
}

export interface Prescription {
  id: string;
  appointment_id?: string;
  doctor_id: string;
  patient_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  issued_at: string;
  expires_at?: string;
  created_at: string;
}

export interface Review {
  id: string;
  doctor_id: string;
  patient_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  users?: User;
}
