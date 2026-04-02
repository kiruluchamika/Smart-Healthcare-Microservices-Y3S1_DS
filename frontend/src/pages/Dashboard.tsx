import PatientDashboardPage from './patient/PatientDashboard';
import { motion } from 'framer-motion';
import { Activity, ArrowRight, Calendar, Settings, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAuthUserRole } from '../services/authSession';

function DoctorDashboardView() {
  const actions = [
    {
      title: 'Manage Doctor Profile',
      description: 'Create or update your professional profile details.',
      href: '/doctors/profile',
      icon: Settings,
      color: 'from-teal-600 to-cyan-500',
    },
    {
      title: 'Availability Management',
      description: 'Open your availability route using your doctor id in URL.',
      href: '/doctors/profile',
      icon: Calendar,
      color: 'from-emerald-600 to-teal-500',
    },
    {
      title: 'Dashboard Summary',
      description: 'Use your doctor id to access detailed slot and profile insights.',
      href: '/doctors/profile',
      icon: Activity,
      color: 'from-blue-600 to-indigo-500',
    },
  ];

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Doctor Workspace</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          This view is focused on doctor operations only. Discovery is available for patients.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {actions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + index * 0.07 }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className={`inline-flex rounded-xl bg-gradient-to-r ${action.color} p-2 text-white`}>
              <action.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">{action.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{action.description}</p>
            <Link
              to={action.href}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
            >
              Open
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
        className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"
      >
        <p className="text-sm font-semibold text-amber-800">Doctor id routes</p>
        <p className="mt-2 text-sm text-amber-700">
          For id-based pages, use paths like /doctors/123/availability and /doctors/123/dashboard with
          your profile id.
        </p>
      </motion.div>
    </>
  );
}

function AdminDashboardView() {
  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Admin Governance Panel</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Verification and compliance tools for doctor-service management.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="inline-flex rounded-xl bg-gradient-to-r from-slate-800 to-slate-600 p-2 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Doctor Verification</h2>
          <p className="mt-2 text-sm text-slate-600">
            Review verification status changes and track verification history for governance workflows.
          </p>
          <Link
            to="/doctors/admin/verification"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Open Verification Tools
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="inline-flex rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 p-2 text-white">
            <Settings className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Doctor Operations</h2>
          <p className="mt-2 text-sm text-slate-600">
            Access operational doctor tools for profile management and support tasks when required.
          </p>
          <Link
            to="/doctors/profile"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Open Doctor Profile Tools
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const role = getAuthUserRole();

  return (
    <div className="min-h-screen pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto">
        {role === 'DOCTOR' ? (
          <DoctorDashboardView />
        ) : role === 'ADMIN' ? (
          <AdminDashboardView />
        ) : (
          <PatientDashboardPage />
        )}
      </div>
    </div>
  );
}
