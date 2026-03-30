import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Save } from 'lucide-react';
import { createDoctor, getDoctorById, updateDoctor } from '../../services/doctor/doctorApi';
import type { DoctorCreatePayload, DoctorServiceDoctor, DoctorUpdatePayload } from '../../types/doctor';

interface FormState extends DoctorCreatePayload {
  active: boolean;
}

const defaultForm: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  specialization: '',
  qualifications: '',
  experienceYears: 0,
  licenseNumber: '',
  bio: '',
  active: true,
};

export default function DoctorProfileManager() {
  const [targetId, setTargetId] = useState('');
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<'create' | 'update'>('create');

  const mapDoctorToForm = (doctor: DoctorServiceDoctor): FormState => ({
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    email: doctor.email,
    phone: doctor.phone,
    specialization: doctor.specialization,
    qualifications: doctor.qualifications,
    experienceYears: doctor.experienceYears,
    licenseNumber: doctor.licenseNumber,
    bio: doctor.bio || '',
    active: doctor.active,
  });

  const updateField = (key: keyof FormState, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const loadDoctor = async () => {
    const numericId = Number(targetId);
    if (!numericId) {
      setServerMessage('Provide a valid doctor id to load profile.');
      return;
    }

    setLoading(true);
    setServerMessage('');

    try {
      const doctor = await getDoctorById(numericId);
      setForm(mapDoctorToForm(doctor));
      setMode('update');
      setServerMessage('Doctor profile loaded. You can edit and save changes.');
    } catch (error) {
      setMode('create');
      setServerMessage(error instanceof Error ? error.message : 'Unable to load doctor profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setServerMessage('');
    setFieldErrors({});

    try {
      if (mode === 'create') {
        await createDoctor(form);
        setServerMessage('Doctor profile created successfully.');
        setForm(defaultForm);
      } else {
        const numericId = Number(targetId);
        if (!numericId) {
          setServerMessage('Doctor id is required for updating.');
          return;
        }

        await updateDoctor(numericId, form as DoctorUpdatePayload);
        setServerMessage('Doctor profile updated successfully.');
      }
    } catch (error) {
      const typedError = error as Error & { fieldErrors?: Record<string, string> };
      setServerMessage(typedError.message || 'Unable to save doctor profile.');
      setFieldErrors(typedError.fieldErrors || {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-teal-50 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">Doctor Profile Manager</h1>
          <p className="mt-2 text-sm text-slate-600">Create or update doctor profiles with backend-validated fields.</p>
        </motion.div>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="number"
              min={1}
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="Enter doctor id to load existing profile"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none ring-teal-400 focus:ring"
            />
            <button
              type="button"
              onClick={loadDoctor}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Load profile
            </button>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {serverMessage && (
            <p className={`mb-4 rounded-lg px-3 py-2 text-sm ${fieldErrors && Object.keys(fieldErrors).length ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {serverMessage}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {[
              { key: 'firstName', label: 'First name', type: 'text' },
              { key: 'lastName', label: 'Last name', type: 'text' },
              { key: 'email', label: 'Email', type: 'email' },
              { key: 'phone', label: 'Phone', type: 'tel' },
              { key: 'specialization', label: 'Specialization', type: 'text' },
              { key: 'qualifications', label: 'Qualifications', type: 'text' },
              { key: 'experienceYears', label: 'Experience years', type: 'number' },
              { key: 'licenseNumber', label: 'License number', type: 'text' },
            ].map((field) => (
              <label key={field.key} className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{field.label}</span>
                <input
                  type={field.type}
                  value={form[field.key as keyof FormState] as string | number}
                  onChange={(e) => updateField(
                    field.key as keyof FormState,
                    field.type === 'number' ? Number(e.target.value || 0) : e.target.value,
                  )}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
                />
                {fieldErrors[field.key] && <span className="mt-1 block text-xs text-rose-600">{fieldErrors[field.key]}</span>}
              </label>
            ))}

            <label className="md:col-span-2 block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Bio</span>
              <textarea
                rows={4}
                value={form.bio || ''}
                onChange={(e) => updateField('bio', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
              />
              {fieldErrors.bio && <span className="mt-1 block text-xs text-rose-600">{fieldErrors.bio}</span>}
            </label>

            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => updateField('active', e.target.checked)}
                className="accent-teal-600"
              />
              Active profile
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-teal-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {mode === 'create' ? <PlusCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {loading ? 'Saving...' : mode === 'create' ? 'Create doctor profile' : 'Update doctor profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
