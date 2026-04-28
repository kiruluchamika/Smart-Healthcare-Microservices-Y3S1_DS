import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, AlertCircle, CheckCircle, User as UserIcon, Activity, Heart, Shield, MapPin, Upload, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { patientApi } from '../services/patientApi';
import { notifyProfileUpdated, updateAuthUser } from '../services/authSession';
import { CreateOrUpdateProfileRequest, PatientProfile } from '../types/patient';
import { getDisplayName } from '../utils/name';
import {
  calculateAgeYears,
  isDateOfBirthValid,
  isPatientAddressValid,
  isPatientContactNumberValid,
  isPatientNameValid,
  normalizeContactNumber,
  normalizePlainText,
} from '../utils/patientProfile';
import axios from 'axios';

const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

const DOB_MONTH_OPTIONS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const DOB_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const DOB_YEAR_OPTIONS = Array.from({ length: 121 }, (_, i) => String(new Date().getFullYear() - i));

const buildDobFromParts = (year: string, month: string, day: string) => {
  if (!year || !month || !day) {
    return '';
  }

  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const dayNumber = Number(day);

  const date = new Date(yearNumber, monthNumber - 1, dayNumber);
  const isValidDate =
    date.getFullYear() === yearNumber &&
    date.getMonth() === monthNumber - 1 &&
    date.getDate() === dayNumber;

  if (!isValidDate) {
    return '';
  }

  return `${year}-${month}-${day}`;
};

type ProfileFormErrors = Partial<Record<keyof CreateOrUpdateProfileRequest, string>>;

export default function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageSaving, setImageSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ProfileFormErrors>({});
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [selectedProfileFile, setSelectedProfileFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const profileImageObjectUrlRef = useRef<string | null>(null);
  const profilePreviewObjectUrlRef = useRef<string | null>(null);
  const fieldRefs = useRef<Partial<Record<keyof CreateOrUpdateProfileRequest, HTMLElement | null>>>({});
  
  const [formData, setFormData] = useState<CreateOrUpdateProfileRequest>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: undefined,
    bloodGroup: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    allergies: '',
    chronicConditions: '',
    bio: ''
  });

  const displayName = getDisplayName(profile?.firstName, profile?.lastName);
  const dateOfBirthAge = calculateAgeYears(formData.dateOfBirth || null);

  const clearProfileImageObjectUrl = () => {
    if (profileImageObjectUrlRef.current) {
      URL.revokeObjectURL(profileImageObjectUrlRef.current);
      profileImageObjectUrlRef.current = null;
    }
  };

  const clearProfilePreviewObjectUrl = () => {
    if (profilePreviewObjectUrlRef.current) {
      URL.revokeObjectURL(profilePreviewObjectUrlRef.current);
      profilePreviewObjectUrlRef.current = null;
    }
  };

  const loadProfilePicture = async () => {
    if (!profile?.profilePictureUrl) {
      clearProfileImageObjectUrl();
      setProfileImageUrl(null);
      return;
    }

    try {
      const response = await patientApi.getProfilePictureBlob();
      clearProfileImageObjectUrl();
      const objectUrl = URL.createObjectURL(response.data);
      profileImageObjectUrlRef.current = objectUrl;
      setProfileImageUrl(objectUrl);
    } catch {
      clearProfileImageObjectUrl();
      setProfileImageUrl(null);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await patientApi.getProfile();
        if (res.success) {
          setProfile(res.data);
          const [year = '', month = '', day = ''] = (res.data.dateOfBirth || '').split('-');
          setDobYear(year);
          setDobMonth(month);
          setDobDay(day);
          setFormData({
            firstName: res.data.firstName || '',
            lastName: res.data.lastName || '',
            dateOfBirth: res.data.dateOfBirth || '',
            gender: res.data.gender || undefined,
            bloodGroup: res.data.bloodGroup || '',
            address: res.data.address || '',
            emergencyContactName: res.data.emergencyContactName || '',
            emergencyContactPhone: res.data.emergencyContactPhone || '',
            allergies: res.data.allergies || '',
            chronicConditions: res.data.chronicConditions || '',
            bio: res.data.bio || ''
          });
          if (res.data.profilePictureUrl) {
            try {
              const response = await patientApi.getProfilePictureBlob();
              clearProfileImageObjectUrl();
              const objectUrl = URL.createObjectURL(response.data);
              profileImageObjectUrlRef.current = objectUrl;
              setProfileImageUrl(objectUrl);
            } catch {
              clearProfileImageObjectUrl();
              setProfileImageUrl(null);
            }
          } else {
            clearProfileImageObjectUrl();
            setProfileImageUrl(null);
          }
        }
      } catch (err) {
        setError('Failed to load profile. Please try refreshing.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    return () => {
      clearProfileImageObjectUrl();
      clearProfilePreviewObjectUrl();
    };
  }, []);

  useEffect(() => {
    const builtDate = buildDobFromParts(dobYear, dobMonth, dobDay);
    setFormData((prev) => {
      if (prev.dateOfBirth === builtDate) {
        return prev;
      }

      return {
        ...prev,
        dateOfBirth: builtDate,
      };
    });
  }, [dobDay, dobMonth, dobYear]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    let nextValue = value;
    if (name === 'firstName' || name === 'lastName') {
      nextValue = value.replace(/[^A-Za-z ]/g, '');
    }

    if (name === 'emergencyContactPhone') {
      nextValue = normalizeContactNumber(value);
    }

    if (name === 'gender' && value === '') {
      setFormData({ ...formData, gender: undefined });
    } else {
      setFormData({ ...formData, [name]: nextValue });
    }

    if (fieldErrors[name as keyof CreateOrUpdateProfileRequest]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    // Clear alerts on edit
    if (error) setError('');
    if (successMsg) setSuccessMsg('');
  };

  const handleDobPartChange = (part: 'day' | 'month' | 'year', value: string) => {
    if (part === 'day') {
      setDobDay(value);
    }

    if (part === 'month') {
      setDobMonth(value);
    }

    if (part === 'year') {
      setDobYear(value);
    }

    if (fieldErrors.dateOfBirth) {
      setFieldErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
    }

    if (error) setError('');
    if (successMsg) setSuccessMsg('');
  };

  const focusFirstInvalidField = (errors: ProfileFormErrors) => {
    const orderedFields: Array<keyof CreateOrUpdateProfileRequest> = [
      'firstName',
      'lastName',
      'dateOfBirth',
      'gender',
      'address',
      'emergencyContactPhone',
    ];

    const firstErrorField = orderedFields.find((field) => errors[field]);
    if (!firstErrorField) {
      return;
    }

    const target = fieldRefs.current[firstErrorField];
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof (target as HTMLInputElement).focus === 'function') {
      (target as HTMLInputElement).focus();
    }
  };

  const validateProfileForm = () => {
    const errors: ProfileFormErrors = {};

    if (!isPatientNameValid(formData.firstName)) {
      errors.firstName = 'First name can only contain letters and spaces (2-100 chars).';
    }

    if (!isPatientNameValid(formData.lastName)) {
      errors.lastName = 'Last name can only contain letters and spaces (2-100 chars).';
    }

    if (!isDateOfBirthValid(formData.dateOfBirth)) {
      errors.dateOfBirth = 'Date of birth must be valid and between ages 0 and 120.';
    }

    if (!formData.gender) {
      errors.gender = 'Please select your gender.';
    }

    if (!isPatientAddressValid(formData.address)) {
      errors.address = 'Address is required and should be at least 5 characters.';
    }

    if (!isPatientContactNumberValid(formData.emergencyContactPhone)) {
      errors.emergencyContactPhone = 'Contact number must contain exactly 10 digits.';
    }

    setFieldErrors(errors);
    return errors;
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      setSelectedProfileFile(null);
      clearProfilePreviewObjectUrl();
      setProfileImagePreview(null);
      return;
    }

    const contentType = (file.type || '').toLowerCase();
    if (!ALLOWED_PROFILE_IMAGE_TYPES.includes(contentType)) {
      setSelectedProfileFile(null);
      clearProfilePreviewObjectUrl();
      setProfileImagePreview(null);
      setError('Only JPEG, PNG, WEBP, or GIF images are allowed.');
      setSuccessMsg('');
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      setSelectedProfileFile(null);
      clearProfilePreviewObjectUrl();
      setProfileImagePreview(null);
      setError('Profile picture size must be 5MB or less.');
      setSuccessMsg('');
      return;
    }

    setSelectedProfileFile(file);

    clearProfilePreviewObjectUrl();
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      profilePreviewObjectUrlRef.current = previewUrl;
      setProfileImagePreview(previewUrl);
    } else {
      setProfileImagePreview(null);
    }

    if (error) setError('');
    if (successMsg) setSuccessMsg('');
  };

  const handleUploadProfilePicture = async () => {
    if (!selectedProfileFile) {
      return;
    }

    try {
      setImageSaving(true);
      setError('');
      setSuccessMsg('');
      const res = await patientApi.uploadProfilePicture(selectedProfileFile);
      if (!res.success) {
        setError(res.message || 'Failed to upload profile picture.');
        return;
      }

      const profileRes = await patientApi.getProfile();
      if (!profileRes.success || !profileRes.data.profilePictureUrl) {
        setError('Upload did not persist on server. Please try again.');
        return;
      }

      setProfile(profileRes.data);
      setSelectedProfileFile(null);
      clearProfilePreviewObjectUrl();
      setProfileImagePreview(null);
      await loadProfilePicture();
      notifyProfileUpdated();
      setSuccessMsg('Profile picture updated successfully!');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message = err.response?.data?.message;

        if (status === 413) {
          setError('Profile image is too large for upload. Please use a file up to 5MB.');
        } else if (status === 401) {
          setError('Your session has expired. Please login again.');
        } else {
          setError((typeof message === 'string' && message) || err.message || 'Failed to upload profile picture.');
        }
      } else {
        setError('Failed to upload profile picture.');
      }
    } finally {
      setImageSaving(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    try {
      setImageSaving(true);
      setError('');
      setSuccessMsg('');
      const res = await patientApi.deleteProfilePicture();
      if (res.success) {
        setProfile(res.data);
        setSelectedProfileFile(null);
        clearProfilePreviewObjectUrl();
        setProfileImagePreview(null);
        clearProfileImageObjectUrl();
        setProfileImageUrl(null);
        notifyProfileUpdated();
        setSuccessMsg('Profile picture removed successfully!');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove profile picture.');
    } finally {
      setImageSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateProfileForm();
    if (Object.keys(validationErrors).length > 0) {
      setError('Please correct the highlighted fields before saving.');
      focusFirstInvalidField(validationErrors);
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');

    const payload: CreateOrUpdateProfileRequest = {
      ...formData,
      firstName: normalizePlainText(formData.firstName),
      lastName: normalizePlainText(formData.lastName),
      dateOfBirth: formData.dateOfBirth,
      address: normalizePlainText(formData.address),
      emergencyContactName: normalizePlainText(formData.emergencyContactName),
      emergencyContactPhone: normalizeContactNumber(formData.emergencyContactPhone),
      allergies: normalizePlainText(formData.allergies),
      chronicConditions: normalizePlainText(formData.chronicConditions),
      bio: normalizePlainText(formData.bio),
    };

    try {
      const res = await patientApi.updateProfile(payload);
      if (res.success) {
        setProfile(res.data);
        const [year = '', month = '', day = ''] = (res.data.dateOfBirth || '').split('-');
        setDobYear(year);
        setDobMonth(month);
        setDobDay(day);
        setFormData((prev) => ({
          ...prev,
          firstName: res.data.firstName || prev.firstName || '',
          lastName: res.data.lastName || prev.lastName || '',
          gender: res.data.gender || prev.gender,
          dateOfBirth: res.data.dateOfBirth || prev.dateOfBirth,
          emergencyContactPhone: res.data.emergencyContactPhone || prev.emergencyContactPhone || '',
        }));
        updateAuthUser({
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          email: res.data.email,
        });
        notifyProfileUpdated();
        setSuccessMsg('Profile updated successfully!');

        navigate('/dashboard#quick-access', { replace: true });
        return;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile. Server error.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50">
       <div className="flex flex-col items-center gap-4">
         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
         <p className="text-slate-500 font-medium">Loading your profile...</p>
       </div>
    </div>
  );

  return (
    <div className="patient-shell">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 font-medium border border-red-100 shadow-sm">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6 p-4 bg-emerald-50 text-emerald-800 rounded-xl flex items-center gap-3 font-medium border border-emerald-100 shadow-sm">
              <CheckCircle className="w-6 h-6 shrink-0 text-emerald-600" />
              <p>{successMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Fixed summary card */}
          <div className="lg:w-1/3 space-y-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-200 sticky top-28">
              
              <div className="h-32 bg-gradient-to-br from-teal-600 to-cyan-600 relative">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm shadow-[inset_0_-1px_0_rgba(255,255,255,0.2)]"></div>
              </div>
              
              <div className="px-6 pb-6 relative">
                 <div className="w-24 h-24 rounded-full border-4 border-white bg-teal-50 shadow-lg flex items-center justify-center absolute -top-12 left-6 overflow-hidden">
                    {profileImagePreview || profileImageUrl ? (
                      <img
                        src={profileImagePreview || profileImageUrl || ''}
                        alt="Patient profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-12 h-12 text-teal-400" />
                    )}
                 </div>
                 <div className="pt-16">
                   <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
                   <p className="text-slate-500 mt-1">{profile?.email}</p>
                 </div>

                 <div className="mt-4 space-y-2">
                    <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                      <Upload className="h-4 w-4" />
                      Choose Photo
                      <input type="file" accept="image/*" className="hidden" onChange={handleProfileFileChange} />
                    </label>

                    {selectedProfileFile && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Preview selected: {selectedProfileFile.name}. Click Upload Photo to save it permanently.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleUploadProfilePicture}
                      disabled={!selectedProfileFile || imageSaving}
                      className="w-full rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {imageSaving ? 'Uploading...' : 'Upload Photo'}
                    </button>

                    {(profile?.profilePictureUrl || profileImagePreview) && (
                      <button
                        type="button"
                        onClick={handleDeleteProfilePicture}
                        disabled={imageSaving}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove Photo
                      </button>
                    )}
                 </div>

                 <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Shield className="w-5 h-5 text-emerald-500" />
                      <span>Account Status: <span className="text-emerald-600 font-bold ml-1">Verified Patient</span></span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Heart className="w-5 h-5 text-rose-500" />
                      <span>Blood Group: <span className="font-bold ml-1 text-slate-900">{profile?.bloodGroup || 'Not set'}</span></span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Activity className="w-5 h-5 text-amber-500" />
                      <span>Platform Usage: <span className="font-bold ml-1 text-slate-900">{profile?.totalReports} Reports stored</span></span>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Editing Form */}
          <div className="lg:w-2/3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8">
              <div className="mb-8 border-b border-slate-200 pb-6">
                <h2 className="text-2xl font-bold text-slate-900">Edit Personal Details</h2>
                <p className="text-slate-500 mt-2">Update your medical information to help our clinicians serve you better.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* General Info */}
                <section>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">1</span>
                    General Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">First Name <span className="text-rose-600">*</span></label>
                      <input ref={(element) => { fieldRefs.current.firstName = element; }} type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} placeholder="Only letters allowed" className="patient-input" />
                      {fieldErrors.firstName && <p className="mt-2 text-xs font-semibold text-rose-600">{fieldErrors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name <span className="text-rose-600">*</span></label>
                      <input ref={(element) => { fieldRefs.current.lastName = element; }} type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange} placeholder="Only letters allowed" className="patient-input" />
                      {fieldErrors.lastName && <p className="mt-2 text-xs font-semibold text-rose-600">{fieldErrors.lastName}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Date of Birth <span className="text-rose-600">*</span></label>
                      <div ref={(element) => { fieldRefs.current.dateOfBirth = element; }} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <select value={dobDay} onChange={(e) => handleDobPartChange('day', e.target.value)} className="patient-input">
                          <option value="">Day</option>
                          {DOB_DAY_OPTIONS.map((day) => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                        <select value={dobMonth} onChange={(e) => handleDobPartChange('month', e.target.value)} className="patient-input">
                          <option value="">Month</option>
                          {DOB_MONTH_OPTIONS.map((month) => (
                            <option key={month.value} value={month.value}>{month.label}</option>
                          ))}
                        </select>
                        <select value={dobYear} onChange={(e) => handleDobPartChange('year', e.target.value)} className="patient-input">
                          <option value="">Year</option>
                          {DOB_YEAR_OPTIONS.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Pick Day, Month, and Year. Allowed age range is 0 to 120 years.</p>
                      {dateOfBirthAge !== null && (
                        <span className="mt-2 inline-block rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                          Age: {dateOfBirthAge} years
                        </span>
                      )}
                      {fieldErrors.dateOfBirth && <p className="mt-2 text-xs font-semibold text-rose-600">{fieldErrors.dateOfBirth}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Biological Gender <span className="text-rose-600">*</span></label>
                      <select ref={(element) => { fieldRefs.current.gender = element; }} name="gender" value={formData.gender || ''} onChange={handleChange} className="patient-input">
                        <option value="">Select Gender...</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                      {fieldErrors.gender && <p className="mt-2 text-xs font-semibold text-rose-600">{fieldErrors.gender}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Blood Group</label>
                      <select name="bloodGroup" value={formData.bloodGroup || ''} onChange={handleChange} className="patient-input">
                        <option value="">Select Blood Group...</option>
                        <option value="A+">A Positive (A+)</option><option value="A-">A Negative (A-)</option>
                        <option value="B+">B Positive (B+)</option><option value="B-">B Negative (B-)</option>
                        <option value="AB+">AB Positive (AB+)</option><option value="AB-">AB Negative (AB-)</option>
                        <option value="O+">O Positive (O+)</option><option value="O-">O Negative (O-)</option>
                      </select>
                    </div>
                  </div>
                </section>

                <hr className="border-slate-200" />

                {/* Contact Data */}
                <section>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center"><MapPin className="w-4 h-4"/></span>
                    Contact & Emergency
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Registered Address <span className="text-rose-600">*</span></label>
                      <input ref={(element) => { fieldRefs.current.address = element; }} type="text" name="address" value={formData.address || ''} onChange={handleChange} placeholder="Unit, Street Name, City, Zip Code" className="patient-input" />
                      {fieldErrors.address && <p className="mt-2 text-xs font-semibold text-rose-600">{fieldErrors.address}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Emergency Contact Name</label>
                      <input type="text" name="emergencyContactName" value={formData.emergencyContactName || ''} onChange={handleChange} placeholder="E.g. Jane Doe" className="patient-input" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Number <span className="text-rose-600">*</span></label>
                      <input ref={(element) => { fieldRefs.current.emergencyContactPhone = element; }} type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone || ''} onChange={handleChange} placeholder="10 digit contact number" className="patient-input" />
                      <p className="mt-2 text-xs text-slate-500">Numbers only. Maximum 10 digits.</p>
                      {fieldErrors.emergencyContactPhone && <p className="mt-2 text-xs font-semibold text-rose-600">{fieldErrors.emergencyContactPhone}</p>}
                    </div>
                  </div>
                </section>

                <hr className="border-slate-200" />

                {/* Medical Specifics */}
                <section>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center"><Heart className="w-4 h-4"/></span>
                    Medical Profile Details
                  </h3>
                  <div className="grid grid-cols-1 gap-6 pl-10">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Known Allergies</label>
                      <textarea name="allergies" value={formData.allergies || ''} onChange={handleChange} rows={2} placeholder="Penicillin, Peanuts, Latex..." className="patient-input resize-none"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Chronic Conditions</label>
                      <textarea name="chronicConditions" value={formData.chronicConditions || ''} onChange={handleChange} rows={2} placeholder="Asthma, Type 2 Diabetes..." className="patient-input resize-none"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Personal Medical Bio / Notes</label>
                      <textarea name="bio" value={formData.bio || ''} onChange={handleChange} rows={3} placeholder="Any other health-related notes you want to present to your clinical team." className="patient-input resize-none"></textarea>
                    </div>
                  </div>
                </section>

                <div className="pt-8 flex justify-end">
                  <motion.button 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                    disabled={saving} 
                    type="submit" 
                    className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-200 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                       <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Saving...</span>
                    ) : (
                       <span className="flex items-center gap-2"><Save className="w-5 h-5" /> Save Changes</span>
                    )}
                  </motion.button>
                </div>
              </form>

            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
