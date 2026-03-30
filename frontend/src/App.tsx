import { useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './layouts/Layout';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AppointmentBooking from './pages/AppointmentBooking';
import Telemedicine from './pages/Telemedicine';
import Profile from './pages/Profile';
import DoctorsDirectory from './pages/doctor/DoctorsDirectory';
import DoctorDetail from './pages/doctor/DoctorDetail';
import DoctorProfileManager from './pages/doctor/DoctorProfileManager';
import DoctorAvailabilityManager from './pages/doctor/DoctorAvailabilityManager';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorVerificationAdmin from './pages/doctor/DoctorVerificationAdmin';
import AIChat from './components/AIChat';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { getAuthUserRole, isUserAuthenticated } from './services/authSession';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  return isUserAuthenticated() ? children : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }: { children: JSX.Element }) {
  return isUserAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
}

type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';

function ProtectedRoleRoute({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles: Role[];
}) {
  if (!isUserAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const role = getAuthUserRole();
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><Landing /></Layout>} />
        <Route path="/auth" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
        <Route path="/login" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute><Layout><AppointmentBooking /></Layout></ProtectedRoute>} />
        <Route path="/consultation/:id" element={<ProtectedRoute><Layout><Telemedicine /></Layout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
        <Route path="/doctors" element={<ProtectedRoleRoute allowedRoles={['PATIENT']}><Layout><DoctorsDirectory /></Layout></ProtectedRoleRoute>} />
        <Route path="/doctors/profile" element={<ProtectedRoleRoute allowedRoles={['DOCTOR', 'ADMIN']}><Layout><DoctorProfileManager /></Layout></ProtectedRoleRoute>} />
        <Route path="/doctors/:id" element={<ProtectedRoleRoute allowedRoles={['PATIENT']}><Layout><DoctorDetail /></Layout></ProtectedRoleRoute>} />
        <Route path="/doctors/:id/availability" element={<ProtectedRoleRoute allowedRoles={['DOCTOR', 'ADMIN']}><Layout><DoctorAvailabilityManager /></Layout></ProtectedRoleRoute>} />
        <Route path="/doctors/:id/dashboard" element={<ProtectedRoleRoute allowedRoles={['DOCTOR', 'ADMIN']}><Layout><DoctorDashboard /></Layout></ProtectedRoleRoute>} />
        <Route path="/doctors/admin/verification" element={<ProtectedRoleRoute allowedRoles={['ADMIN']}><Layout><DoctorVerificationAdmin /></Layout></ProtectedRoleRoute>} />
      </Routes>

      <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {!isChatOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow z-40"
        >
          <MessageCircle className="w-6 h-6" />
        </motion.button>
      )}
    </Router>
  );
}

export default App;
