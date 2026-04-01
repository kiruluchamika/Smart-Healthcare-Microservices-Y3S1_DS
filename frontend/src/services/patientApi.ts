import axios from 'axios';
import {
  PatientProfile,
  CreateOrUpdateProfileRequest,
  MedicalReport,
  ReportType,
  MedicalHistory,
  MedicalHistoryRequest
} from '../types/patient';
import { getAuthToken } from './authSession';

// Uses NGINX proxy just like authApi
const API_URL = '/api/patients/me';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const getHeaders = () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Session expired. Please login again.');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const patientApi = {
  // Profile
  getProfile: async () => {
    const response = await axios.get<ApiResponse<PatientProfile>>(`${API_URL}`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  updateProfile: async (data: CreateOrUpdateProfileRequest) => {
    const response = await axios.put<ApiResponse<PatientProfile>>(`${API_URL}`, data, {
      headers: getHeaders(),
    });
    return response.data;
  },

  uploadProfilePicture: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<ApiResponse<PatientProfile>>(`${API_URL}/profile-picture`, formData, {
      headers: getHeaders(),
    });
    return response.data;
  },

  getProfilePictureBlob: async () => {
    const response = await axios.get(`${API_URL}/profile-picture`, {
      headers: getHeaders(),
      responseType: 'blob',
    });
    return response;
  },

  deleteProfilePicture: async () => {
    const response = await axios.delete<ApiResponse<PatientProfile>>(`${API_URL}/profile-picture`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  // Reports
  getReports: async (type?: ReportType) => {
    const url = type ? `${API_URL}/reports?type=${type}` : `${API_URL}/reports`;
    const response = await axios.get<ApiResponse<MedicalReport[]>>(url, {
      headers: getHeaders(),
    });
    return response.data;
  },

  uploadReport: async (file: File, title: string, reportType: ReportType, description?: string, reportDate?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('reportType', reportType);
    if (description) formData.append('description', description);
    if (reportDate) formData.append('reportDate', reportDate);

    const response = await axios.post<ApiResponse<MedicalReport>>(`${API_URL}/reports`, formData, {
      headers: getHeaders(),
    });
    return response.data;
  },

  downloadReportUrl: (id: number) => {
    // Generate an absolute URL for direct download via window.open, adding token as query param since
    // browser won't send auth headers automatically (Nginx/backend normally need to support token in URL for this, 
    // but we can fetch it via blob alternatively. We'll use blob fetch here)
    return `${API_URL}/reports/${id}/download`;
  },

  downloadReportBlob: async (id: number) => {
    const response = await axios.get(`${API_URL}/reports/${id}/download`, {
      headers: getHeaders(),
      responseType: 'blob', // Important for file download
    });
    return response;
  },

  deleteReport: async (id: number) => {
    const response = await axios.delete<ApiResponse<void>>(`${API_URL}/reports/${id}`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  // History
  getHistory: async () => {
    const response = await axios.get<ApiResponse<MedicalHistory[]>>(`${API_URL}/history`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  addHistory: async (data: MedicalHistoryRequest) => {
    const response = await axios.post<ApiResponse<MedicalHistory>>(`${API_URL}/history`, data, {
      headers: getHeaders(),
    });
    return response.data;
  },

  updateHistory: async (id: number, data: MedicalHistoryRequest) => {
    const response = await axios.put<ApiResponse<MedicalHistory>>(`${API_URL}/history/${id}`, data, {
      headers: getHeaders(),
    });
    return response.data;
  },

  deleteHistory: async (id: number) => {
    const response = await axios.delete<ApiResponse<void>>(`${API_URL}/history/${id}`, {
      headers: getHeaders(),
    });
    return response.data;
  },

  // Prescriptions (Stub)
  getPrescriptions: async () => {
    const response = await axios.get<ApiResponse<any[]>>(`${API_URL}/prescriptions`, {
      headers: getHeaders(),
    });
    return response.data;
  }
};
