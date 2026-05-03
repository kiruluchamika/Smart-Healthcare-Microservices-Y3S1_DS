import axios from 'axios';
import { getAuthToken, getAuthUser, getAuthUserRole } from './authSession';
import { resolveDoctorProfileId } from './doctorIdentity';

const API_URL = '/api/prescriptions';
const PATIENT_PRESCRIPTIONS_URL = '/api/patients/me/prescriptions';

function getBasicAuthHeader() {
  const username = import.meta.env.VITE_DOCTOR_USER || 'doctor';
  const password = import.meta.env.VITE_DOCTOR_PASS || 'doctor123';
  return `Basic ${btoa(`${username}:${password}`)}`;
}

const getHeaders = async () => {
  const user = getAuthUser();
  const role = getAuthUserRole();
  const doctorId = role === 'DOCTOR' ? await resolveDoctorProfileId() : null;

  return {
    'Content-Type': 'application/json',
    Authorization: getBasicAuthHeader(),
    ...(role === 'DOCTOR' && doctorId ? { 'X-Doctor-Id': String(doctorId) } : {}),
    ...(role === 'PATIENT' && user?.id ? { 'X-Patient-Id': String(user.id) } : {}),
  };
};

function unwrapPrescriptionResponse<T>(payload: T | { data?: T }) {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data?: T }).data as T;
  }

  return payload as T;
}

export const createPrescription = async (data: any) => {
  const response = await axios.post(API_URL, data, { headers: await getHeaders() });
  return unwrapPrescriptionResponse(response.data);
};

export const signPrescription = async (id: number) => {
  const response = await axios.post(`${API_URL}/${id}/sign`, {}, { headers: await getHeaders() });
  return unwrapPrescriptionResponse(response.data);
};

export const getPrescription = async (id: number) => {
  const response = await axios.get(`${API_URL}/${id}`, { headers: await getHeaders() });
  return unwrapPrescriptionResponse(response.data);
};

export const getPrescriptionByAppointment = async (appointmentId: number) => {
  const response = await axios.get(`${API_URL}/by-appointment/${appointmentId}`, { headers: await getHeaders() });
  return unwrapPrescriptionResponse(response.data);
};

export const getPrescriptionsByPatient = async (patientId: number) => {
  const user = getAuthUser();
  const role = getAuthUserRole();
  const token = getAuthToken();

  if (role === 'PATIENT' && user?.id === patientId && token) {
    const response = await axios.get(PATIENT_PRESCRIPTIONS_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const prescriptions = unwrapPrescriptionResponse<any[]>(response.data);
    return Array.isArray(prescriptions) ? prescriptions : [];
  }

  const response = await axios.get(`${API_URL}/by-patient/${patientId}`, { headers: await getHeaders() });
  const prescriptions = unwrapPrescriptionResponse<any[]>(response.data);
  return Array.isArray(prescriptions) ? prescriptions : [];
};
