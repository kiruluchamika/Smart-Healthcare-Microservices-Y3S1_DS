import type {
  SuggestDoctorApiError,
  SuggestDoctorRequest,
  SuggestDoctorResponse,
} from '../types/aiDoctorSuggestion';
import { getAuthToken } from './authSession';

const AI_DOCTOR_SUGGESTION_API_BASE = import.meta.env.VITE_AI_DOCTOR_SUGGESTION_API_BASE || '/api/ai';

function getAuthHeaders() {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Session expired. Please login again.');
  }

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function mapApiError(payload: SuggestDoctorApiError | null, status: number) {
  if (payload?.fieldErrors) {
    const firstFieldError = Object.values(payload.fieldErrors)[0];
    if (firstFieldError) {
      return firstFieldError;
    }
  }

  if (payload?.message) {
    return payload.message;
  }

  if (status === 503) {
    return 'AI suggestion service is temporarily unavailable. Please try again shortly.';
  }

  return 'Failed to get AI doctor suggestions. Please try again.';
}

export async function suggestDoctors(payload: SuggestDoctorRequest): Promise<SuggestDoctorResponse> {
  const response = await fetch(`${AI_DOCTOR_SUGGESTION_API_BASE}/suggest-doctor`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  const parsed = raw
    ? (() => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })()
    : null;

  if (!response.ok) {
    throw new Error(mapApiError(parsed as SuggestDoctorApiError | null, response.status));
  }

  return parsed as SuggestDoctorResponse;
}
