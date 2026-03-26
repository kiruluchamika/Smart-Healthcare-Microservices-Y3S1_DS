import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const auth = {
  async signUp(email: string, password: string, fullName: string) {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
  },

  async signInWithPassword(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  async signOut() {
    return await supabase.auth.signOut();
  },

  async getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async resetPassword(email: string) {
    return await supabase.auth.resetPasswordForEmail(email);
  },

  onAuthStateChange(callback: any) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

export const db = {
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    return { data, error };
  },

  async updateUserProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .maybeSingle();

    return { data, error };
  },

  async getDoctors() {
    const { data, error } = await supabase
      .from('doctors')
      .select('*, users:user_id(*)')
      .eq('is_verified', true);

    return { data, error };
  },

  async getDoctorProfile(doctorId: string) {
    const { data, error } = await supabase
      .from('doctors')
      .select('*, users:user_id(*)')
      .eq('id', doctorId)
      .maybeSingle();

    return { data, error };
  },

  async getAppointments(userId: string, userType: 'patient' | 'doctor' = 'patient') {
    const query = supabase
      .from('appointments')
      .select('*, doctors:doctor_id(*, users:user_id(*)), users:patient_id(*)');

    if (userType === 'patient') {
      query.eq('patient_id', userId);
    } else {
      query.eq('doctor_id', userId);
    }

    const { data, error } = await query.order('scheduled_at', { ascending: false });
    return { data, error };
  },

  async createAppointment(patientId: string, doctorId: string, scheduledAt: string) {
    const { data, error } = await supabase
      .from('appointments')
      .insert([
        {
          patient_id: patientId,
          doctor_id: doctorId,
          scheduled_at: scheduledAt,
          appointment_type: 'video',
          status: 'scheduled',
        },
      ])
      .select()
      .maybeSingle();

    return { data, error };
  },

  async updateAppointment(appointmentId: string, updates: any) {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', appointmentId)
      .select()
      .maybeSingle();

    return { data, error };
  },

  async getHealthRecords(patientId: string) {
    const { data, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_date', { ascending: false });

    return { data, error };
  },

  async createHealthRecord(patientId: string, recordType: string, description: string) {
    const { data, error } = await supabase
      .from('health_records')
      .insert([
        {
          patient_id: patientId,
          record_type: recordType,
          description,
        },
      ])
      .select()
      .maybeSingle();

    return { data, error };
  },

  async getDoctorReviews(doctorId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users:patient_id(*)')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  async createReview(doctorId: string, patientId: string, rating: number, comment: string) {
    const { data, error } = await supabase
      .from('reviews')
      .insert([
        {
          doctor_id: doctorId,
          patient_id: patientId,
          rating,
          comment,
        },
      ])
      .select()
      .maybeSingle();

    return { data, error };
  },

  async createConsultation(appointmentId: string) {
    const { data, error } = await supabase
      .from('consultations')
      .insert([
        {
          appointment_id: appointmentId,
          started_at: new Date(),
        },
      ])
      .select()
      .maybeSingle();

    return { data, error };
  },

  async endConsultation(consultationId: string, notes: string) {
    const { data: consultation, error: fetchError } = await supabase
      .from('consultations')
      .select('started_at')
      .eq('id', consultationId)
      .maybeSingle();

    if (fetchError) return { data: null, error: fetchError };

    const duration = Math.floor(
      (new Date().getTime() - new Date(consultation.started_at).getTime()) / 60000
    );

    const { data, error } = await supabase
      .from('consultations')
      .update({
        ended_at: new Date(),
        duration_minutes: duration,
        notes,
      })
      .eq('id', consultationId)
      .select()
      .maybeSingle();

    return { data, error };
  },
};
