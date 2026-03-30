export type DoctorVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type DoctorOnboardingState = 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'SUSPENDED';
export type DoctorSortDirection = 'asc' | 'desc';
export type DoctorUserRole = 'doctor' | 'admin';

export interface DoctorServiceDoctor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  qualifications: string;
  experienceYears: number;
  licenseNumber: string;
  bio?: string;
  verificationStatus: DoctorVerificationStatus;
  active: boolean;
  profileCompletenessScore: number;
  onboardingState: DoctorOnboardingState;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: DoctorSortDirection;
}

export interface DoctorSearchParams {
  specialization?: string;
  verified?: boolean;
  active?: boolean;
  minExperience?: number;
  dayOfWeek?: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface DoctorCreatePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  qualifications: string;
  experienceYears: number;
  licenseNumber: string;
  bio?: string;
  active?: boolean;
}

export interface DoctorUpdatePayload extends DoctorCreatePayload {
  active: boolean;
}

export interface DoctorAvailability {
  id: number;
  doctorId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorAvailabilityPayload {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface DoctorDashboardSummary {
  doctorId: number;
  doctorName: string;
  specialization: string;
  verificationStatus: DoctorVerificationStatus;
  active: boolean;
  profileCompletenessScore: number;
  totalSlots: number;
  availableSlots: number;
  weeklySlotCount: Record<string, number>;
  profileInsight: string;
}

export interface DoctorVerificationHistoryItem {
  id: number;
  doctorId: number;
  previousStatus: DoctorVerificationStatus;
  newStatus: DoctorVerificationStatus;
  reason?: string;
  notes?: string;
  changedBy: string;
  changedAt: string;
}

export interface DoctorVerificationStatusUpdatePayload {
  verificationStatus: DoctorVerificationStatus;
  reason?: string;
  notes?: string;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  traceId: string;
  fieldErrors?: Record<string, string>;
}
