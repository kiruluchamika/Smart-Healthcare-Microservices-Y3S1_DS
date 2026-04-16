export interface SuggestDoctorRequest {
  patientId: number;
  query: string;
}

export interface DoctorSuggestion {
  doctorId: number;
  doctorName: string;
  specialization: string;
  experienceYears: number;
  verificationStatus: string;
  nextAvailableSlot: string;
  semanticScore: number;
  finalScore: number;
}

export interface SuggestDoctorResponse {
  query: string;
  recommendedSpecialty: string;
  explanation: string;
  topDoctors: DoctorSuggestion[];
}

export interface SuggestDoctorApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string>;
}
