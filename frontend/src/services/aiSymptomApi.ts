import type {
  AiSymptomApiError,
  AnalyzeSymptomRequest,
  AnalyzeSymptomResponse,
  PagedSymptomHistoryResponse,
  SymptomHistoryItem,
} from '../types/aiSymptom';
import { getAuthToken } from './authSession';

const AI_SYMPTOM_API_BASE = import.meta.env.VITE_AI_SYMPTOM_API_BASE || '/api/ai-symptoms';

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

function parseJson(raw: string) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mapApiError(payload: AiSymptomApiError | null, status: number, raw: string) {
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
    return 'AI symptom triage is temporarily unavailable. Please try again shortly.';
  }

  if (status === 502) {
    return 'The AI provider returned an invalid response. Please try again.';
  }

  if (status === 404) {
    return 'AI symptom route was not found. Please confirm the API gateway and proxy configuration are running.';
  }

  if (status === 401 || status === 403) {
    return 'Your session is not authorized for this action. Please log in again.';
  }

  if (raw && !payload?.message) {
    return `Request failed with status ${status}.`;
  }

  return 'Failed to process the symptom analysis request.';
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const raw = await response.text();
  const parsed = parseJson(raw);

  if (!response.ok) {
    throw new Error(mapApiError(parsed as AiSymptomApiError | null, response.status, raw));
  }

  return parsed as T;
}

export function analyzeSymptoms(payload: AnalyzeSymptomRequest) {
  return request<AnalyzeSymptomResponse>(`${AI_SYMPTOM_API_BASE}/analyze`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export function getSymptomHistory(patientId: number, page = 0, size = 10) {
  return request<PagedSymptomHistoryResponse>(`${AI_SYMPTOM_API_BASE}/history/${patientId}?page=${page}&size=${size}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
}

export function getSymptomAnalysisById(id: number) {
  return request<SymptomHistoryItem>(`${AI_SYMPTOM_API_BASE}/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
}
