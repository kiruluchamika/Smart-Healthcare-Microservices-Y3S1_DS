export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type ReportType = 'LAB_REPORT' | 'PRESCRIPTION' | 'DIAGNOSIS' | 'VACCINATION' | 'IMAGING' | 'OTHER';

export type EventType = 'DIAGNOSIS' | 'SURGERY' | 'HOSPITALIZATION' | 'ALLERGY' | 'VACCINATION' | 'MEDICATION' | 'LAB_RESULT' | 'OTHER';

export interface PatientProfile {
  id: number;
  authUserId: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string | null;
  gender: Gender | null;
  bloodGroup: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  allergies: string | null;
  chronicConditions: string | null;
  profilePictureUrl: string | null;
  bio: string | null;
  totalReports: number;
  totalHistoryEntries: number;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalReport {
  id: number;
  title: string;
  description: string | null;
  originalFileName: string;
  fileSize: number;
  contentType: string;
  reportType: ReportType;
  reportDate: string | null;
  uploadedAt: string;
}

export interface MedicalHistory {
  id: number;
  eventType: EventType;
  title: string;
  description: string | null;
  eventDate: string;
  doctorName: string | null;
  facilityName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrUpdateProfileRequest {
  dateOfBirth?: string;
  gender?: Gender;
  bloodGroup?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  chronicConditions?: string;
  bio?: string;
}

export interface MedicalHistoryRequest {
  eventType: EventType;
  title: string;
  description?: string;
  eventDate: string;
  doctorName?: string;
  facilityName?: string;
  notes?: string;
}
