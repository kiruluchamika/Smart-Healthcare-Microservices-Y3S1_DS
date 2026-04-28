import axios from 'axios';
import { getAuthUser } from './authSession';

const API_URL = '/api/prescriptions';
const DOCTOR_PROFILE_ID_KEY = 'doctorProfileId';

function getBasicAuthHeader() {
  const username = import.meta.env.VITE_DOCTOR_USER || 'doctor';
  const password = import.meta.env.VITE_DOCTOR_PASS || 'doctor123';
  return `Basic ${btoa(`${username}:${password}`)}`;
}

const getHeaders = () => {
  const user = getAuthUser();
  const doctorId = localStorage.getItem(DOCTOR_PROFILE_ID_KEY) || (user?.id ? String(user.id) : null);

  return {
    'Content-Type': 'application/json',
    Authorization: getBasicAuthHeader(),
    ...(doctorId ? { 'X-Doctor-Id': doctorId } : {}),
  };
};

export const createPrescription = async (data: any) => {
  const response = await axios.post(API_URL, data, { headers: getHeaders() });
  return response.data;
};

export const signPrescription = async (id: number) => {
  const response = await axios.post(`${API_URL}/${id}/sign`, {}, { headers: getHeaders() });
  return response.data;
};

export const getPrescription = async (id: number) => {
  const response = await axios.get(`${API_URL}/${id}`, { headers: getHeaders() });
  return response.data;
};

export const getPrescriptionByAppointment = async (appointmentId: number) => {
  const response = await axios.get(`${API_URL}/by-appointment/${appointmentId}`, { headers: getHeaders() });
  return response.data;
};

export const getPrescriptionsByPatient = async (patientId: number) => {
  const response = await axios.get(`${API_URL}/by-patient/${patientId}`, { headers: getHeaders() });
  return response.data;
};
