import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, AlertCircle, CheckCircle, User as UserIcon, Activity, Heart, Shield, Phone, MapPin } from 'lucide-react';
import { patientApi } from '../services/patientApi';
import { CreateOrUpdateProfileRequest, Gender, PatientProfile } from '../types/patient';

export default function Profile() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [formData, setFormData] = useState<CreateOrUpdateProfileRequest>({
    dateOfBirth: '',
    gender: 'OTHER',
    bloodGroup: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    allergies: '',
    chronicConditions: '',
    bio: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await patientApi.getProfile();
        if (res.success) {
          setProfile(res.data);
          setFormData({
            dateOfBirth: res.data.dateOfBirth || '',
            gender: res.data.gender || 'OTHER',
            bloodGroup: res.data.bloodGroup || '',
            address: res.data.address || '',
            emergencyContactName: res.data.emergencyContactName || '',
            emergencyContactPhone: res.data.emergencyContactPhone || '',
            allergies: res.data.allergies || '',
            chronicConditions: res.data.chronicConditions || '',
            bio: res.data.bio || ''
          });
        }
      } catch (err) {
        setError('Failed to load profile. Please try refreshing.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear alerts on edit
    if (error) setError('');
    if (successMsg) setSuccessMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await patientApi.updateProfile(formData);
      if (res.success) {
        setProfile(res.data);
        setSuccessMsg('Profile updated successfully!');
        // Auto-hide success message after 5 seconds
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile. Server error.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50">
       <div className="flex flex-col items-center gap-4">
         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
         <p className="text-gray-500 font-medium">Loading your profile...</p>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 pt-24">
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
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100 sticky top-28">
              
              <div className="h-32 bg-gradient-to-br from-blue-600 to-indigo-700 relative">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm shadow-[inset_0_-1px_0_rgba(255,255,255,0.2)]"></div>
              </div>
              
              <div className="px-6 pb-6 relative">
                 <div className="w-24 h-24 rounded-full border-4 border-white bg-indigo-50 shadow-lg flex items-center justify-center absolute -top-12 left-6">
                    <UserIcon className="w-12 h-12 text-indigo-400" />
                 </div>
                 <div className="pt-16">
                   <h1 className="text-2xl font-bold text-gray-900">{profile?.firstName} {profile?.lastName}</h1>
                   <p className="text-gray-500 mt-1">{profile?.email}</p>
                 </div>

                 <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Shield className="w-5 h-5 text-emerald-500" />
                      <span>Account Status: <span className="text-emerald-600 font-bold ml-1">Verified Patient</span></span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Heart className="w-5 h-5 text-rose-500" />
                      <span>Blood Group: <span className="font-bold ml-1 text-gray-900">{profile?.bloodGroup || 'Not set'}</span></span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Activity className="w-5 h-5 text-amber-500" />
                      <span>Platform Usage: <span className="font-bold ml-1 text-gray-900">{profile?.totalReports} Reports stored</span></span>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Editing Form */}
          <div className="lg:w-2/3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
              <div className="mb-8 border-b border-gray-100 pb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Personal Details</h2>
                <p className="text-gray-500 mt-2">Update your medical information to help our clinicians serve you better.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* General Info */}
                <section>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">1</span>
                    General Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                      <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Biological Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all shadow-sm">
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Group</label>
                      <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all shadow-sm">
                        <option value="">Select Blood Group...</option>
                        <option value="A+">A Positive (A+)</option><option value="A-">A Negative (A-)</option>
                        <option value="B+">B Positive (B+)</option><option value="B-">B Negative (B-)</option>
                        <option value="AB+">AB Positive (AB+)</option><option value="AB-">AB Negative (AB-)</option>
                        <option value="O+">O Positive (O+)</option><option value="O-">O Negative (O-)</option>
                      </select>
                    </div>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Contact Data */}
                <section>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center"><MapPin className="w-4 h-4"/></span>
                    Contact & Emergency
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Registered Address</label>
                      <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Unit, Street Name, City, Zip Code" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contact Name</label>
                      <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} placeholder="E.g. Jane Doe" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Phone</label>
                      <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} placeholder="+1 234 567 890" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all shadow-sm" />
                    </div>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* Medical Specifics */}
                <section>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center"><Heart className="w-4 h-4"/></span>
                    Medical Profile Details
                  </h3>
                  <div className="grid grid-cols-1 gap-6 pl-10">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Known Allergies</label>
                      <textarea name="allergies" value={formData.allergies} onChange={handleChange} rows={2} placeholder="Penicillin, Peanuts, Latex..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all shadow-sm resize-none"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Chronic Conditions</label>
                      <textarea name="chronicConditions" value={formData.chronicConditions} onChange={handleChange} rows={2} placeholder="Asthma, Type 2 Diabetes..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all shadow-sm resize-none"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Personal Medical Bio / Notes</label>
                      <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} placeholder="Any other health-related notes you want to present to your clinical team." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all shadow-sm resize-none"></textarea>
                    </div>
                  </div>
                </section>

                <div className="pt-8 flex justify-end">
                  <motion.button 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                    disabled={saving} 
                    type="submit" 
                    className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
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
