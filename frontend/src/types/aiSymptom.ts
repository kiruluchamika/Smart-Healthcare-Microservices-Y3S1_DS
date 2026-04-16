export type SymptomUrgencyLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EMERGENCY';

export interface AnalyzeSymptomRequest {
  patientId: number;
  symptomsText: string;
  age: number;
  sex: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  durationHours: number;
  chronicConditions?: string[];
  currentMedications?: string[];
  allergies?: string[];
  locale?: string;
}

export interface AnalyzeSymptomResponse {
  analysisId: number;
  patientId: number;
  symptomSummary: string;
  possibleConditionCategories: string[];
  urgencyLevel: SymptomUrgencyLevel;
  recommendedDoctorSpecialization: string;
  redFlagWarningSigns: string[];
  nextStepRecommendation: string;
  disclaimer: string;
  generatedAt: string;
  provider: string;
  model: string;
  correlationId: string;
  fallbackUsed: boolean;
}

export interface SymptomHistoryItem {
  id: number;
  patientId: number;
  symptomSummary: string;
  possibleConditionCategories: string[];
  urgencyLevel: SymptomUrgencyLevel;
  recommendedDoctorSpecialization: string;
  redFlagWarningSigns: string[];
  nextStepRecommendation: string;
  disclaimer: string;
  correlationId: string;
  createdAt: string;
}

export interface PagedSymptomHistoryResponse {
  items: SymptomHistoryItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AiSymptomApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string>;
}
