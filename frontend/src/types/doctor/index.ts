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
  boardCertifications?: string;
  languagesSpoken?: string;
  clinicLocations?: string;
  insuranceProviders?: string;
  licenseExpiryDate?: string | null;
  consultationFee?: string | null;
  verificationStatus: DoctorVerificationStatus;
  active: boolean;
  profileCompletenessScore: number;
  onboardingState: DoctorOnboardingState;
  profilePictureUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentBookingDoctor {
  id: number;
  fullName: string;
  specialty: string;
  qualifications: string;
  experienceYears: number;
  location: string;
  availabilityLabel: string;
  consultationFee?: string | null;
  pricingLabel: string;
  profileCompletenessScore: number;
  initials: string;
  profilePictureUrl?: string | null;
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
  boardCertifications?: string;
  languagesSpoken?: string;
  clinicLocations?: string;
  insuranceProviders?: string;
  licenseExpiryDate?: string | null;
  consultationFee?: number;
  profilePictureUrl?: string | null;
}

export interface DoctorUpdatePayload extends DoctorCreatePayload { }

export interface DoctorAvailability {
  id: number;
  doctorId: number;
  dayOfWeek?: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  slotDuration: number;
  isAvailable: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorAvailabilityPayload {
  dayOfWeek?: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  slotDuration: 15 | 30 | 45 | 60;
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

export interface DoctorChangeRequestPayload {
  fields: string[];
  reason: string;
  notes?: string;
  requestedValues?: Record<string, string | number>;
}

export interface DoctorChangeRequestDecisionPayload {
  action: 'APPROVE' | 'REJECT';
  adminNotes?: string;
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
