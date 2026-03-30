import PatientDashboardPage from './patient/PatientDashboard';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Calendar,
  Clock,
  Heart,
  Plus,
  Settings,
  ShieldCheck,
  Stethoscope,
  Video,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAuthUserRole } from '../services/authSession';

function PatientDashboard() {
  const upcomingAppointments = [
    {
      id: 1,
      doctorName: 'Dr. Sarah Johnson',
      specialty: 'Cardiologist',
      date: '2024-04-15',
      time: '2:00 PM',
      type: 'Video Consultation',
    },
    {
      id: 2,
      doctorName: 'Dr. Michael Chen',
      specialty: 'General Practitioner',
      date: '2024-04-18',
      time: '10:30 AM',
      type: 'In-Person',
    },
  ];

  const healthMetrics = [
    {
      icon: Heart,
      label: 'Heart Rate',
      value: '72',
      unit: 'bpm',
      status: 'normal',
    },
    {
      icon: Activity,
      label: 'Steps Today',
      value: '8,234',
      unit: 'steps',
      status: 'good',
    },
    {
      icon: Heart,
      label: 'Blood Pressure',
      value: '120/80',
      unit: 'mmHg',
      status: 'normal',
    },
    {
      icon: Activity,
      label: 'Sleep Hours',
      value: '7.5',
      unit: 'hrs',
      status: 'good',
    },
  ];

  const quickActions = [
    {
      icon: Calendar,
      label: 'Book Appointment',
      href: '/appointments',
      color: 'from-blue-600 to-cyan-500',
    },
    {
      icon: Stethoscope,
      label: 'Discover Doctors',
      href: '/doctors',
      color: 'from-indigo-600 to-blue-500',
    },
    {
      icon: Video,
      label: 'Start Consultation',
      href: '/consultation/1',
      color: 'from-purple-600 to-pink-500',
    },
    {
      icon: Heart,
      label: 'Health Records',
      href: '/profile',
      color: 'from-orange-600 to-red-500',
    },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 sm:mb-10 lg:mb-12"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Welcome Back</h1>
        <p className="text-sm sm:text-base text-gray-600">Here is your health overview</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-8 sm:mb-10 lg:mb-12"
      >
        {quickActions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + index * 0.08 }}
            whileHover={{ y: -4 }}
            className="group"
          >
            <Link
              to={action.href}
              className={`relative block h-full min-h-[120px] sm:min-h-[132px] overflow-hidden rounded-xl p-5 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all bg-gradient-to-br ${action.color}`}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-full flex flex-col justify-between gap-3">
                <action.icon className="w-7 h-7 sm:w-8 sm:h-8" />
                <p className="font-semibold text-sm sm:text-base leading-snug">{action.label}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="xl:col-span-2"
        >
          <div className="bg-white rounded-2xl border border-gray-200/30 shadow-lg p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Upcoming Appointments</h2>
              <Link
                to="/appointments"
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 text-sm sm:text-base"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {upcomingAppointments.map((appointment, idx) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
                  className="border border-gray-200/30 rounded-xl p-4 sm:p-5 lg:p-6 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">{appointment.doctorName}</h3>
                      <p className="text-sm text-gray-600 mb-3">{appointment.specialty}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {appointment.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {appointment.time}
                        </span>
                      </div>
                    </div>
                    <div className="self-start sm:self-center shrink-0 bg-gradient-to-br from-blue-600 to-cyan-500 text-white px-3 py-2 rounded-lg text-sm font-medium">
                      {appointment.type === 'Video Consultation' ? (
                        <Video className="w-5 h-5" />
                      ) : (
                        <Calendar className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-6 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-700 font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Plus className="w-5 h-5" />
              Book New Appointment
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-200/30 shadow-lg p-4 sm:p-6 lg:p-8"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Health Metrics</h2>
          <div className="space-y-4">
            {healthMetrics.map((metric, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + idx * 0.1 }}
                className="bg-gray-50/50 rounded-lg p-4 hover:bg-gray-100/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">{metric.label}</p>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      metric.status === 'good'
                        ? 'bg-green-500'
                        : metric.status === 'normal'
                          ? 'bg-blue-500'
                          : 'bg-yellow-500'
                    }`}
                  />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                  <span className="text-xs text-gray-500">{metric.unit}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}

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
          For id-based pages, use paths like /doctors/123/availability and /doctors/123/dashboard with your profile id.
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
          <>
            <PatientDashboardPage />
            <div className="mt-8">
              <PatientDashboard />
            </div>
          </>
        )}
      </div>
    </div>
  );
}