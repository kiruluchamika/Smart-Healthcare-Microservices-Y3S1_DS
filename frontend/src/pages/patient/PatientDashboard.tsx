import React, { useEffect, useState } from 'react';
import { patientApi } from '../../services/patientApi';
import { PatientProfile } from '../../types/patient';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, FileText, Clock, Heart, AlertCircle, Droplet, User as UserIcon, Phone, Calendar, Stethoscope, Video, Sparkles } from 'lucide-react';
import { getAuthUser } from '../../services/authSession';
import { getDisplayName } from '../../utils/name';

const topNavItems = [
  {
    label: 'Appointments',
    href: '/appointments',
    icon: Calendar,
    color: 'from-teal-600 to-cyan-500',
  },
  {
    label: 'Discover Doctors',
    href: '/doctors',
    icon: Stethoscope,
    color: 'from-cyan-600 to-blue-500',
  },
  {
    label: 'AI Doctor Suggestion',
    href: '/ai-doctor-suggestion',
    icon: Sparkles,
    color: 'from-orange-500 to-amber-500',
  },
  {
    label: 'Medical Reports',
    href: '/reports',
    icon: FileText,
    color: 'from-slate-700 to-teal-600',
  },
  {
    label: 'Medical History',
    href: '/history',
    icon: Activity,
    color: 'from-teal-500 to-emerald-500',
  },
  {
    label: 'Prescriptions',
    href: '/prescriptions',
    icon: Heart,
    color: 'from-emerald-500 to-cyan-500',
  },
  {
    label: 'Telemedicine',
    href: '/consultation/1',
    icon: Video,
    color: 'from-blue-600 to-cyan-500',
  },
];

const PatientDashboard: React.FC = () => {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authUser = getAuthUser() as { firstName?: string; lastName?: string; email?: string } | null;

  const buildProfileFallback = (source?: Partial<PatientProfile>): PatientProfile => ({
    id: source?.id ?? 0,
    authUserId: source?.authUserId ?? 0,
    firstName: source?.firstName || authUser?.firstName || '',
    lastName: source?.lastName || authUser?.lastName || '',
    email: source?.email || authUser?.email || '',
    dateOfBirth: source?.dateOfBirth ?? null,
    gender: source?.gender ?? null,
    bloodGroup: source?.bloodGroup ?? null,
    address: source?.address ?? null,
    emergencyContactName: source?.emergencyContactName ?? null,
    emergencyContactPhone: source?.emergencyContactPhone ?? null,
    allergies: source?.allergies ?? null,
    chronicConditions: source?.chronicConditions ?? null,
    profilePictureUrl: source?.profilePictureUrl ?? null,
    bio: source?.bio ?? null,
    totalReports: source?.totalReports ?? 0,
    totalHistoryEntries: source?.totalHistoryEntries ?? 0,
    createdAt: source?.createdAt ?? '',
    updatedAt: source?.updatedAt ?? '',
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await patientApi.getProfile();
        setProfile(buildProfileFallback(res.success ? res.data : undefined));
      } catch (err) {
        setProfile(buildProfileFallback());
        setError('Some patient details could not be loaded. Showing available account data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error) return (
    <div className="flex h-[80vh] items-center justify-center">
       <div className="bg-red-50 text-red-600 p-6 rounded-2xl shadow-sm border border-red-100 flex items-center gap-4">
         <AlertCircle className="w-8 h-8" />
         <p className="font-medium text-lg">{error}</p>
       </div>
    </div>
  );

  if (!profile) return null;

  const greetingName = getDisplayName(profile.firstName, profile.lastName);
  const legalName = getDisplayName(profile.firstName, profile.lastName, 'Not Set');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 100 } }
  };

  return (
    <div className="patient-shell pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="rounded-2xl border border-teal-100 bg-white/75 backdrop-blur-sm p-4 sm:p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Patient Navigation Panel</h2>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 rounded-full px-2.5 py-1">
                Quick Access
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {topNavItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.08 + index * 0.04 }}
                  whileHover={{ y: -2 }}
                  className="group"
                >
                  <Link
                    to={item.href}
                    className={`relative flex h-full min-h-[96px] flex-col justify-between overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br ${item.color} p-3.5 text-white shadow-md transition-all hover:shadow-lg`}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
                    <item.icon className="relative h-5 w-5" />
                    <p className="relative text-sm font-semibold leading-tight">{item.label}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-slate-700 to-slate-900 shadow-xl mb-10"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-orange-300 opacity-20 blur-3xl"></div>
          
          <div className="relative z-10 px-8 py-12 sm:px-12 sm:py-16 md:flex md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                Hello, {greetingName} 👋
              </h1>
              <p className="text-teal-100 text-lg max-w-2xl">
                Welcome to your command center. Check your latest diagnostic reports, upcoming appointments, and health metrics directly from here.
              </p>
            </div>
            <div className="mt-8 md:mt-0 flex gap-4">
               <Link to="/appointments" className="px-6 py-3 bg-white text-teal-700 font-bold rounded-xl shadow-lg hover:bg-teal-50 transition-all transform hover:-translate-y-1">
                 Book Appointment
               </Link>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
        >
          {/* Stat 1 */}
          <motion.div variants={itemVariants} className="patient-card-hover p-6 flex items-center gap-5 cursor-default">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Medical Reports</p>
              <h3 className="text-3xl font-bold text-slate-900">{profile.totalReports}</h3>
            </div>
          </motion.div>

          {/* Stat 2 */}
          <motion.div variants={itemVariants} className="patient-card-hover p-6 flex items-center gap-5 cursor-default">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-teal-600">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Timeline Events</p>
              <h3 className="text-3xl font-bold text-slate-900">{profile.totalHistoryEntries}</h3>
            </div>
          </motion.div>

          {/* Stat 3 */}
          <motion.div variants={itemVariants} className="patient-card-hover p-6 flex items-center gap-5 cursor-default">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
              <Droplet className="w-7 h-7 fill-red-100" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Blood Group</p>
              <h3 className="text-3xl font-bold text-slate-900">{profile.bloodGroup || '--'}</h3>
            </div>
          </motion.div>

          {/* Stat 4 */}
          <motion.div variants={itemVariants} className="patient-card-hover p-6 flex items-center gap-5 cursor-default">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Allergies</p>
              <h3 className="text-lg font-bold text-slate-900 truncate">{profile.allergies ? 'Reported' : 'None'}</h3>
            </div>
          </motion.div>
        </motion.div>

        {/* Action Grid */}
        <h2 className="text-xl font-bold text-slate-900 mb-6 px-2">Quick Navigation</h2>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
        >
          <motion.div variants={itemVariants}>
            <Link to="/reports" className="block h-full rounded-3xl p-8 border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-teal-200 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Diagnostics Vault</h3>
              <p className="text-slate-500">Securely view and upload your blood tests, MRI scans, and lab results.</p>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link to="/history" className="block h-full rounded-3xl p-8 border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-teal-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-slate-300 group-hover:scale-110 transition-transform">
                <Activity className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Health Timeline</h3>
              <p className="text-slate-500">Track your past surgeries, treatments, vaccinations, and overall medical history.</p>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link to="/prescriptions" className="block h-full rounded-3xl p-8 border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">My Prescriptions</h3>
              <p className="text-slate-500">Check active medication orders, dosage instructions, and refill options.</p>
            </Link>
          </motion.div>
        </motion.div>

        {/* Profile Card */}
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4 }}
           className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
        >
           <div className="border-b border-slate-200 px-8 py-6 flex justify-between items-center bg-slate-50">
             <div className="flex items-center gap-3">
               <UserIcon className="w-6 h-6 text-slate-500" />
               <h3 className="text-xl font-bold text-slate-900">Personal File</h3>
             </div>
             <Link to="/profile" className="text-sm font-bold text-teal-700 hover:text-teal-800 bg-teal-50 px-4 py-2 rounded-lg transition-colors">
               Edit Profile
             </Link>
           </div>
           <div className="p-8 grid md:grid-cols-2 gap-8">
             <div className="space-y-6">
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-1">Full Legal Name</p>
                  <p className="text-slate-900 font-medium text-lg">{legalName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-1">Email Address</p>
                  <p className="text-slate-900 font-medium text-lg">{profile.email}</p>
                </div>
                <div>
                   <p className="text-sm text-slate-500 font-medium mb-1">Registered Address</p>
                   <p className="text-slate-900 font-medium">{profile.address || 'Address not on file.'}</p>
                </div>
             </div>
             <div className="space-y-6">
                <div className="bg-red-50 p-5 rounded-2xl border border-red-100 text-red-900 flex items-start gap-4">
                  <div className="mt-1">
                    <Phone className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-1">Emergency Contact</p>
                    <p className="font-bold text-lg">{profile.emergencyContactName || 'None Provided'}</p>
                    <p>{profile.emergencyContactPhone || 'Please update your profile to add this.'}</p>
                  </div>
                </div>
                <div>
                   <p className="text-sm text-slate-500 font-medium mb-1">Chronic Conditions noted by doctor</p>
                   <p className="text-slate-900 italic font-medium">{profile.chronicConditions || 'No chronic conditions reported.'}</p>
                </div>
             </div>
           </div>
        </motion.div>

      </div>
    </div>
  );
};

export default PatientDashboard;
