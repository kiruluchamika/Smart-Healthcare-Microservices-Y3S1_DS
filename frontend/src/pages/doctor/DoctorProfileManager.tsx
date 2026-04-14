import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, PlusCircle, Save, Upload } from 'lucide-react';
import { DoctorTopNav } from '../../components/doctor/DoctorTopNav';
import { getAuthUser } from '../../services/authSession';
import { createDoctor, getDoctorByEmail, getDoctorById, getVerificationHistory, submitDoctorChangeRequest, updateDoctor } from '../../services/doctor/doctorApi';
import type { DoctorChangeRequestPayload, DoctorCreatePayload, DoctorServiceDoctor, DoctorUpdatePayload, DoctorVerificationHistoryItem } from '../../types/doctor';

const DOCTOR_PROFILE_ID_KEY = 'doctorProfileId';

interface FormState extends DoctorCreatePayload { }

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
  boardCertifications: '',
  languagesSpoken: '',
  clinicLocations: '',
  insuranceProviders: '',
  licenseExpiryDate: '',
  consultationFee: undefined,
  profilePictureUrl: '',
};

const requiredFieldLabels = [
  'First name',
  'Last name',
  'Email',
  'Phone',
  'Specialization',
  'Qualifications',
  'Experience years',
  'License number',
];

const approvedLockedFieldKeys: Array<keyof FormState> = [
  'firstName',
  'lastName',
  'email',
  'specialization',
  'qualifications',
  'experienceYears',
  'licenseNumber',
];

const lockedFieldLabels: Record<string, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  specialization: 'Specialization',
  qualifications: 'Qualifications',
  experienceYears: 'Experience years',
  licenseNumber: 'License number',
};

const CHANGE_REQUEST_PREFIX = 'PROFILE_CHANGE_REQUEST';

type DoctorChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface DoctorChangeRequestViewModel {
  id: number;
  title: string;
  status: DoctorChangeRequestStatus;
  requestedAt: string;
  requestedBy: string;
  fieldsLabel: string;
  adminNote: string;
}

function isDoctorChangeRequestEntry(item: DoctorVerificationHistoryItem) {
  const reason = (item.reason || '').toUpperCase().trim();
  return reason === CHANGE_REQUEST_PREFIX || reason.startsWith(`${CHANGE_REQUEST_PREFIX}:`);
}

function parseDoctorChangeRequestStatus(item: DoctorVerificationHistoryItem): DoctorChangeRequestStatus {
  const notes = item.notes || '';
  if (notes.includes('Resolution: APPROVE')) {
    return 'APPROVED';
  }
  if (notes.includes('Resolution: REJECT')) {
    return 'REJECTED';
  }
  return 'PENDING';
}

function extractFieldsLabel(notes?: string) {
  if (!notes) {
    return 'N/A';
  }
  const fieldsToken = notes
    .split('|')
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith('fields:'));

  return fieldsToken ? fieldsToken.replace(/^fields:\s*/i, '').trim() || 'N/A' : 'N/A';
}

function extractAdminNote(notes?: string) {
  if (!notes) {
    return '';
  }

  const noteToken = notes
    .split('|')
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith('adminnotes:'));

  return noteToken ? noteToken.replace(/^adminnotes:\s*/i, '').trim() : '';
}

function formatRequestTitle(reason?: string) {
  if (!reason) {
    return 'Profile change request';
  }

  const cleaned = reason.replace(/^PROFILE_CHANGE_REQUEST:\s*/i, '').replace(/^PROFILE_CHANGE_REQUEST\s*/i, '').trim();
  return cleaned || 'Profile change request';
}

export default function DoctorProfileManager() {
  const navigate = useNavigate();
  const [targetId, setTargetId] = useState('');
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<'create' | 'update'>('create');
  const [isApprovedProfile, setIsApprovedProfile] = useState(false);
  const [changeRequestFields, setChangeRequestFields] = useState<string[]>([]);
  const [changeRequestReason, setChangeRequestReason] = useState('');
  const [changeRequestNotes, setChangeRequestNotes] = useState('');
  const [changeRequestValues, setChangeRequestValues] = useState<Record<string, string>>({});
  const [submittingChangeRequest, setSubmittingChangeRequest] = useState(false);
  const [changeRequests, setChangeRequests] = useState<DoctorChangeRequestViewModel[]>([]);

  useEffect(() => {
    const loadOwnProfile = async () => {
      const authUser = getAuthUser();
      if (!authUser?.email) {
        return;
      }

      try {
        const doctor = await getDoctorByEmail(authUser.email);
        setTargetId(String(doctor.id));
        setForm(mapDoctorToForm(doctor));
        setIsApprovedProfile(doctor.verificationStatus === 'APPROVED');
        setMode('update');
        localStorage.setItem(DOCTOR_PROFILE_ID_KEY, String(doctor.id));
        await loadDoctorChangeRequests(doctor.id);
      } catch {
        // Prefill with authenticated account info when profile is not created yet.
        setIsApprovedProfile(false);
        setMode('create');
        setForm((prev) => ({
          ...prev,
          firstName: authUser.firstName || prev.firstName,
          lastName: authUser.lastName || prev.lastName,
          email: authUser.email || prev.email,
          phone: authUser.phoneNumber || prev.phone,
        }));
        setServerMessage('Complete the required profile fields to activate your doctor account. Basic account details were prefilled for you.');
      }
    };

    void loadOwnProfile();
  }, []);

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
    boardCertifications: doctor.boardCertifications || '',
    languagesSpoken: doctor.languagesSpoken || '',
    clinicLocations: doctor.clinicLocations || '',
    insuranceProviders: doctor.insuranceProviders || '',
    licenseExpiryDate: doctor.licenseExpiryDate || '',
    consultationFee: doctor.consultationFee ? Number(doctor.consultationFee) : undefined,
    profilePictureUrl: doctor.profilePictureUrl || '',
  });

  const updateField = (key: keyof FormState, value: string | number | boolean | undefined) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayload = () => ({
    ...form,
    licenseExpiryDate:
      typeof form.licenseExpiryDate === 'string' && form.licenseExpiryDate.trim()
        ? form.licenseExpiryDate
        : undefined,
    consultationFee:
      form.consultationFee && Number(form.consultationFee) > 0 ? Number(form.consultationFee) : undefined,
  });

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
      setIsApprovedProfile(doctor.verificationStatus === 'APPROVED');
      localStorage.setItem(DOCTOR_PROFILE_ID_KEY, String(doctor.id));
      setMode('update');
      setServerMessage('Doctor profile loaded. You can edit and save changes.');
      await loadDoctorChangeRequests(doctor.id);
    } catch (error) {
      setIsApprovedProfile(false);
      setMode('create');
      setChangeRequests([]);
      setServerMessage(error instanceof Error ? error.message : 'Unable to load doctor profile.');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorChangeRequests = async (doctorId: number) => {
    try {
      const history = await getVerificationHistory(doctorId, 'doctor');
      const items = history
        .filter(isDoctorChangeRequestEntry)
        .map<DoctorChangeRequestViewModel>((item) => ({
          id: item.id,
          title: formatRequestTitle(item.reason),
          status: parseDoctorChangeRequestStatus(item),
          requestedAt: item.changedAt,
          requestedBy: item.changedBy,
          fieldsLabel: extractFieldsLabel(item.notes),
          adminNote: extractAdminNote(item.notes),
        }));

      setChangeRequests(items);
    } catch {
      setChangeRequests([]);
    }
  };

  const isFieldLockedForApprovedProfile = (key: keyof FormState) => (
    mode === 'update' && isApprovedProfile && approvedLockedFieldKeys.includes(key)
  );

  const handleToggleChangeRequestField = (field: string) => {
    setChangeRequestFields((prev) => (
      prev.includes(field)
        ? prev.filter((item) => item !== field)
        : [...prev, field]
    ));

    setChangeRequestValues((prev) => {
      if (Object.prototype.hasOwnProperty.call(prev, field)) {
        const clone = { ...prev };
        delete clone[field];
        return clone;
      }

      const currentValue = form[field as keyof FormState];
      return {
        ...prev,
        [field]: currentValue === undefined || currentValue === null ? '' : String(currentValue),
      };
    });
  };

  const handleChangeRequestValue = (field: string, value: string) => {
    setChangeRequestValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitChangeRequest = async () => {
    const numericId = Number(targetId);
    if (!numericId) {
      setServerMessage('Doctor id is required to submit a change request.');
      return;
    }

    if (!changeRequestFields.length) {
      setServerMessage('Select at least one locked field for the change request.');
      return;
    }

    if (!changeRequestReason.trim()) {
      setServerMessage('Please provide a reason for the requested locked-field changes.');
      return;
    }

    const payload: DoctorChangeRequestPayload = {
      fields: changeRequestFields,
      reason: changeRequestReason.trim(),
      notes: changeRequestNotes.trim() || undefined,
      requestedValues: changeRequestFields.reduce<Record<string, string | number>>((acc, field) => {
        const raw = (changeRequestValues[field] ?? '').trim();
        if (!raw) {
          return acc;
        }

        if (field === 'experienceYears') {
          const parsed = Number(raw);
          acc[field] = Number.isFinite(parsed) ? parsed : raw;
          return acc;
        }

        acc[field] = raw;
        return acc;
      }, {}),
    };

    setSubmittingChangeRequest(true);
    setServerMessage('');

    try {
      const result = await submitDoctorChangeRequest(numericId, payload);
      setServerMessage(result.message || 'Change request submitted for admin review.');
      setChangeRequestFields([]);
      setChangeRequestReason('');
      setChangeRequestNotes('');
      setChangeRequestValues({});
      await loadDoctorChangeRequests(numericId);
    } catch (error) {
      const typedError = error as Error;
      setServerMessage(typedError.message || 'Unable to submit change request.');
    } finally {
      setSubmittingChangeRequest(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setServerMessage('');
    setFieldErrors({});

    try {
      if (mode === 'create') {
        const createdDoctor = await createDoctor(buildPayload());
        localStorage.setItem(DOCTOR_PROFILE_ID_KEY, String(createdDoctor.id));
        setServerMessage('Doctor profile created successfully. Redirecting to dashboard...');
        setForm(defaultForm);

        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        const numericId = Number(targetId);
        if (!numericId) {
          setServerMessage('Doctor id is required for updating.');
          return;
        }

        const updatedDoctor = await updateDoctor(numericId, buildPayload() as DoctorUpdatePayload);
        localStorage.setItem(DOCTOR_PROFILE_ID_KEY, String(updatedDoctor.id));
        setServerMessage('Doctor profile updated successfully. Redirecting to dashboard...');

        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
          navigate('/doctors/profile');
        }, 1500);
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
    <div className="min-h-screen bg-slate-50 relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 lg:px-8 text-slate-900 font-sans selection:bg-teal-500/30">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-200/40 rounded-full blur-[120px] pointer-events-none opacity-60" />
      <div className="absolute bottom-0 left-[-10%] w-[600px] h-[600px] bg-blue-200/30 rounded-full blur-[100px] pointer-events-none opacity-60" />

      <div className="relative z-10 mx-auto max-w-4xl">
        <DoctorTopNav doctorId={targetId ? Number(targetId) : undefined} />
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-teal-100 backdrop-blur-sm shadow-sm mb-4">
             <Save className="h-4 w-4 text-teal-600" />
             <span className="text-xs font-bold uppercase tracking-widest text-teal-700">Profile Management</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 mb-2">Doctor Profile Setup</h1>
          <p className="text-base text-slate-500 max-w-2xl mx-auto">Create or update your doctor profile credentials. These details are securely vetted before being published to patients.</p>
        </motion.div>

        <motion.section 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 rounded-[2rem] border border-white bg-white/70 backdrop-blur-xl p-8 shadow-lg shadow-teal-900/[0.03]"
        >
          <h2 className="mb-4 text-lg font-bold text-slate-800">Advanced Override</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="number"
              min={1}
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="Enter doctor ID to load existing profile"
              className="w-full rounded-2xl bg-white/90 border border-slate-200 px-5 py-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-300 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 shadow-sm"
            />
            <button
              type="button"
              onClick={loadDoctor}
              disabled={loading}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100 disabled:opacity-50"
            >
              Load Profile
            </button>
          </div>
        </motion.section>

        <motion.form 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onSubmit={handleSubmit} 
          className="rounded-[2.5rem] border border-white bg-white/70 backdrop-blur-xl p-8 sm:p-12 shadow-xl shadow-teal-900/[0.04]"
        >
          {mode === 'create' && (
            <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-amber-900">
              <p className="text-sm font-bold">Complete your profile in 3 steps:</p>
              <p className="mt-1 text-sm">1. Confirm prefilled account details.</p>
              <p className="text-sm">2. Fill all required professional fields marked with *.</p>
              <p className="text-sm">3. Click Publish Doctor Profile.</p>
            </div>
          )}

          {mode === 'update' && isApprovedProfile && (
            <div className="mb-8 rounded-2xl border border-sky-200 bg-sky-50/80 p-5 text-sky-900">
              <p className="text-sm font-bold">Verified profile protection is active.</p>
              <p className="mt-1 text-sm">Identity and credential fields are locked after approval. Submit an admin review request for those changes.</p>
            </div>
          )}

          {mode === 'update' && isApprovedProfile && (
            <div className="mb-8 rounded-2xl border border-indigo-200 bg-indigo-50/80 p-5 text-indigo-900">
              <p className="text-sm font-bold">Request locked-field update</p>
              <p className="mt-1 text-sm">Select fields and submit your request. Admin can review and approve changes.</p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {approvedLockedFieldKeys.map((fieldKey) => {
                  const field = String(fieldKey);
                  const checked = changeRequestFields.includes(field);
                  return (
                    <label key={field} className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleChangeRequestField(field)}
                        className="h-4 w-4"
                      />
                      <span>{lockedFieldLabels[field] || field}</span>
                    </label>
                  );
                })}
              </div>

              {changeRequestFields.length > 0 && (
                <div className="mt-4 space-y-3">
                  {changeRequestFields.map((field) => (
                    <label key={field} className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-indigo-700">
                        Proposed {lockedFieldLabels[field] || field}
                      </span>
                      <input
                        type={field === 'experienceYears' ? 'number' : 'text'}
                        min={field === 'experienceYears' ? 0 : undefined}
                        value={changeRequestValues[field] ?? ''}
                        onChange={(e) => handleChangeRequestValue(field, e.target.value)}
                        className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-200/40"
                      />
                    </label>
                  ))}
                </div>
              )}

              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-indigo-700">Reason *</span>
                <input
                  type="text"
                  value={changeRequestReason}
                  onChange={(e) => setChangeRequestReason(e.target.value)}
                  placeholder="Why should these locked details be updated?"
                  className="w-full rounded-2xl border border-indigo-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-200/40"
                />
              </label>

              <label className="mt-3 block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-indigo-700">Notes (Optional)</span>
                <textarea
                  rows={3}
                  value={changeRequestNotes}
                  onChange={(e) => setChangeRequestNotes(e.target.value)}
                  placeholder="Add supporting details for admin review"
                  className="w-full rounded-2xl border border-indigo-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none resize-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-200/40"
                />
              </label>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmitChangeRequest}
                  disabled={submittingChangeRequest || loading}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingChangeRequest ? 'Submitting request...' : 'Submit Change Request'}
                </button>
              </div>
            </div>
          )}

          {mode === 'update' && isApprovedProfile && (
            <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-900">My Change Requests</p>
                <button
                  type="button"
                  onClick={() => {
                    const numericId = Number(targetId);
                    if (numericId) {
                      void loadDoctorChangeRequests(numericId);
                    }
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Refresh Status
                </button>
              </div>

              {!changeRequests.length ? (
                <p className="text-sm text-slate-500">No change requests submitted yet.</p>
              ) : (
                <div className="space-y-3">
                  {changeRequests.map((request) => (
                    <article key={request.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{request.title}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          request.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : request.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600">Fields: {request.fieldsLabel}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Submitted by {request.requestedBy} on {new Date(request.requestedAt).toLocaleString()}
                      </p>
                      {request.adminNote && (
                        <p className="mt-2 text-xs font-medium text-slate-700">Admin note: {request.adminNote}</p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {serverMessage && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden mb-8">
               <p className={`rounded-xl border p-4 text-sm font-semibold shadow-sm ${fieldErrors && Object.keys(fieldErrors).length ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-teal-200 bg-teal-50 text-teal-700'}`}>
                 {serverMessage}
               </p>
            </motion.div>
          )}

          <div className="mb-8 flex flex-col items-center sm:items-start sm:flex-row gap-6 pb-8 border-b border-slate-200/60">
            <div className="relative group shrink-0">
              <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg relative">
                 {form.profilePictureUrl ? (
                   <img src={form.profilePictureUrl} alt="Profile preview" className="h-full w-full object-cover" />
                 ) : (
                   <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-300">
                     <Camera className="h-10 w-10" />
                   </div>
                 )}
                 <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Upload className="h-6 w-6 text-white" />
                 </div>
                 <input 
                   type="file" 
                   accept="image/*"
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                   onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                       const reader = new FileReader();
                       reader.onloadend = () => {
                         updateField('profilePictureUrl', reader.result as string);
                       };
                       reader.readAsDataURL(file);
                     }
                   }}
                 />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Profile Photo</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-md">
                Upload a professional headshot. This will be displayed on your public profile and helps patients recognize you. 
                <br/><span className="text-xs text-teal-600 mt-1 inline-block">Real World Note: Images are encoded as base64 for simplicity in this demo.</span>
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              { key: 'firstName', label: 'First name', type: 'text', required: true },
              { key: 'lastName', label: 'Last name', type: 'text', required: true },
              { key: 'email', label: 'Email', type: 'email', required: true },
              { key: 'phone', label: 'Phone', type: 'tel', required: true },
              { key: 'specialization', label: 'Specialization', type: 'text', required: true },
              { key: 'qualifications', label: 'Qualifications', type: 'text', required: true },
              { key: 'experienceYears', label: 'Experience years', type: 'number', required: true },
              { key: 'licenseNumber', label: 'License number', type: 'text', required: true },
            ].map((field) => (
              <label key={field.key} className="block group">
                {(() => {
                  const isLocked = isFieldLockedForApprovedProfile(field.key as keyof FormState);
                  return (
                    <>
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-teal-700/80 group-focus-within:text-teal-600 transition-colors">
                  {field.label}{field.required ? ' *' : ''}
                  {isLocked ? ' (Locked)' : ''}
                </span>
                <input
                  type={field.type}
                  value={form[field.key as keyof FormState] as string | number}
                  onChange={(e) => updateField(
                    field.key as keyof FormState,
                    field.type === 'number' ? Number(e.target.value || 0) : e.target.value,
                  )}
                  disabled={isLocked || loading}
                  className={`w-full rounded-2xl border px-4 py-3.5 text-sm outline-none transition-all duration-300 shadow-[0_2px_10px_rgb(0,0,0,0.02)] ${isLocked ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500' : 'bg-white border-slate-200 text-slate-900 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10'}`}
                />
                {fieldErrors[field.key] && <span className="mt-2 block text-xs font-medium text-rose-600 px-1">{fieldErrors[field.key]}</span>}
                    </>
                  );
                })()}
              </label>
            ))}

            {mode === 'create' && (
              <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">Required fields checklist</p>
                <p className="text-sm text-slate-600">{requiredFieldLabels.join(' • ')}</p>
              </div>
            )}

            <label className="md:col-span-2 block group">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-teal-700/80 group-focus-within:text-teal-600 transition-colors">Biography</span>
              <textarea
                rows={4}
                value={form.bio || ''}
                onChange={(e) => updateField('bio', e.target.value)}
                className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 shadow-[0_2px_10px_rgb(0,0,0,0.02)] resize-none"
              />
              {fieldErrors.bio && <span className="mt-2 block text-xs font-medium text-rose-600 px-1">{fieldErrors.bio}</span>}
            </label>

            <label className="block group">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-teal-700/80 group-focus-within:text-teal-600 transition-colors">Board Certifications</span>
              <textarea
                rows={3}
                value={form.boardCertifications || ''}
                onChange={(e) => updateField('boardCertifications', e.target.value)}
                placeholder="Example: Board Certified in Cardiovascular Medicine"
                className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 shadow-[0_2px_10px_rgb(0,0,0,0.02)] resize-none placeholder-slate-400"
              />
              {fieldErrors.boardCertifications && <span className="mt-2 block text-xs font-medium text-rose-600 px-1">{fieldErrors.boardCertifications}</span>}
            </label>

            <label className="block group">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-teal-700/80 group-focus-within:text-teal-600 transition-colors">Languages Spoken</span>
              <input
                type="text"
                value={form.languagesSpoken || ''}
                onChange={(e) => updateField('languagesSpoken', e.target.value)}
                placeholder="English, Sinhala, Tamil"
                className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 shadow-[0_2px_10px_rgb(0,0,0,0.02)] placeholder-slate-400"
              />
              {fieldErrors.languagesSpoken && <span className="mt-2 block text-xs font-medium text-rose-600 px-1">{fieldErrors.languagesSpoken}</span>}
            </label>

            <label className="block md:col-span-2 group">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-teal-700/80 group-focus-within:text-teal-600 transition-colors">Clinic Locations</span>
              <textarea
                rows={3}
                value={form.clinicLocations || ''}
                onChange={(e) => updateField('clinicLocations', e.target.value)}
                placeholder="City Heart Clinic, Colombo"
                className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 shadow-[0_2px_10px_rgb(0,0,0,0.02)] resize-none placeholder-slate-400"
              />
              {fieldErrors.clinicLocations && <span className="mt-2 block text-xs font-medium text-rose-600 px-1">{fieldErrors.clinicLocations}</span>}
            </label>

            <label className="block md:col-span-2 group">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-teal-700/80 group-focus-within:text-teal-600 transition-colors">Insurance Providers</span>
              <textarea
                rows={3}
                value={form.insuranceProviders || ''}
                onChange={(e) => updateField('insuranceProviders', e.target.value)}
                placeholder="AIA, Allianz, Union Assurance"
                className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 shadow-[0_2px_10px_rgb(0,0,0,0.02)] resize-none placeholder-slate-400"
              />
              {fieldErrors.insuranceProviders && <span className="mt-2 block text-xs font-medium text-rose-600 px-1">{fieldErrors.insuranceProviders}</span>}
            </label>

            <label className="block group">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-teal-700/80 group-focus-within:text-teal-600 transition-colors">License Expiry Date</span>
              <input
                type="date"
                value={form.licenseExpiryDate || ''}
                onChange={(e) => updateField('licenseExpiryDate', e.target.value)}
                className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
              />
              {fieldErrors.licenseExpiryDate && <span className="mt-2 block text-xs font-medium text-rose-600 px-1">{fieldErrors.licenseExpiryDate}</span>}
            </label>

            <label className="block group">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-teal-700/80 group-focus-within:text-teal-600 transition-colors">Channeling Price (LKR)</span>
              <input
                type="number"
                min={1}
                step="0.01"
                value={form.consultationFee ?? ''}
                onChange={(e) => updateField('consultationFee', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Leave empty for fixed standard fee"
                className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
              />
              <span className="mt-2 block text-xs font-medium text-slate-500 px-1">
                Overrides the default channeling fee.
              </span>
              {fieldErrors.consultationFee && <span className="mt-2 block text-xs font-medium text-rose-600 px-1">{fieldErrors.consultationFee}</span>}
            </label>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-200/60 flex justify-end">
             <button
               type="submit"
               disabled={loading}
               className="inline-flex items-center gap-3 rounded-2xl bg-teal-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-700 hover:shadow-teal-600/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
             >
               {mode === 'create' ? <PlusCircle className="h-5 w-5" /> : <Save className="h-5 w-5" />}
               {loading ? 'Saving securely...' : mode === 'create' ? 'Publish Doctor Profile' : 'Save Profile Changes'}
             </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
