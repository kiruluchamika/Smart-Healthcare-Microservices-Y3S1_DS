import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, Menu, UserCircle2, X } from 'lucide-react';
import { getDoctorByEmail } from '../services/doctor/doctorApi';
import { patientApi } from '../services/patientApi';
import NotificationBell from './notifications/NotificationBell';
import {
  AUTH_CHANGED_EVENT,
  PROFILE_UPDATED_EVENT,
  clearAuthSession,
  getAuthUser,
  getAuthUserRole,
  isUserAuthenticated,
} from '../services/authSession';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(isUserAuthenticated());
  const [role, setRole] = useState(getAuthUserRole());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDoctorMenuOpen, setIsDoctorMenuOpen] = useState(false);
  const [isPatientMobileMenuOpen, setIsPatientMobileMenuOpen] = useState(false);
  const [patientAvatarUrl, setPatientAvatarUrl] = useState<string | null>(null);
  const [doctorAvatarUrl, setDoctorAvatarUrl] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const avatarObjectUrlRef = useRef<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/admin/login';
  const isLandingPage = location.pathname === '/';
  const isDoctorWorkspaceRoute =
    location.pathname === '/dashboard' ||
    location.pathname === '/doctor/appointments' ||
    location.pathname === '/doctor/reports' ||
    /^\/doctors\/profile(?:\/manage)?$/.test(location.pathname) ||
    /^\/doctors\/\d+\/(?:dashboard|availability)$/.test(location.pathname);
  const isDoctorCompactNavRoute =
    /^\/doctors\/profile(?:\/manage)?$/.test(location.pathname) ||
    /^\/doctors\/\d+\/(?:dashboard|availability)$/.test(location.pathname);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(isUserAuthenticated());
      setRole(getAuthUserRole());
      setIsProfileOpen(false);
      setIsDoctorMenuOpen(false);
      setIsPatientMobileMenuOpen(false);
    };

    const handleProfileUpdated = () => {
      setAvatarVersion((prev) => prev + 1);
    };

    window.addEventListener('storage', syncAuthState);
    window.addEventListener(AUTH_CHANGED_EVENT, syncAuthState);
    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);

    return () => {
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuthState);
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setIsProfileOpen(false);
    setIsDoctorMenuOpen(false);
    setIsPatientMobileMenuOpen(false);
    setIsAuthenticated(isUserAuthenticated());
    setRole(getAuthUserRole());
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current) {
        return;
      }

      if (!profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
        setIsDoctorMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const resetAvatar = () => {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
        avatarObjectUrlRef.current = null;
      }
      if (mounted) {
        setPatientAvatarUrl(null);
      }
    };

    const loadProfileAvatar = async () => {
      if (!isAuthenticated || role !== 'PATIENT') {
        resetAvatar();
        return;
      }

      try {
        const response = await patientApi.getProfilePictureBlob();
        if (!mounted) {
          return;
        }

        if (avatarObjectUrlRef.current) {
          URL.revokeObjectURL(avatarObjectUrlRef.current);
        }

        const objectUrl = URL.createObjectURL(response.data);
        avatarObjectUrlRef.current = objectUrl;
        setPatientAvatarUrl(objectUrl);
      } catch {
        resetAvatar();
      }
    };

    void loadProfileAvatar();

    return () => {
      mounted = false;
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
        avatarObjectUrlRef.current = null;
      }
    };
  }, [isAuthenticated, role, avatarVersion]);

  useEffect(() => {
    let mounted = true;

    const loadDoctorAvatar = async () => {
      if (!isAuthenticated || role !== 'DOCTOR') {
        if (mounted) {
          setDoctorAvatarUrl(null);
        }
        return;
      }

      const authUser = getAuthUser();
      const email = typeof authUser?.email === 'string' ? authUser.email.trim() : '';
      if (!email) {
        if (mounted) {
          setDoctorAvatarUrl(null);
        }
        return;
      }

      try {
        const doctor = await getDoctorByEmail(email);
        if (!mounted) {
          return;
        }
        setDoctorAvatarUrl(doctor.profilePictureUrl || null);
      } catch {
        if (mounted) {
          setDoctorAvatarUrl(null);
        }
      }
    };

    void loadDoctorAvatar();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, role, avatarVersion, location.pathname]);

  const guestNavItems = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/#services' },
    { label: 'About', href: '/#about' },
    { label: 'Contact', href: '/#contact' },
  ];

  const doctorLandingStaticNavItems = [
    { label: 'About', href: '/about' },
    { label: 'Guidelines', href: '/guidelines' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy', href: '/privacy-policy' },
  ];

  const patientNavItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Profile', href: '/profile' },
    { label: 'Book Appointment', href: '/appointments/book' },
    { label: 'My Appointments', href: '/appointments' },
    { label: 'Reports', href: '/reports' },
    { label: 'History', href: '/history' },
    { label: 'AI Symptom', href: '/ai-symptom' },
    { label: 'Discover Doctors', href: '/doctors' },
  ];

  const doctorNavItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Doctor Profile', href: '/doctors/profile' },
    { label: 'Appointments', href: '/doctor/appointments' },
    { label: 'Patient Reports', href: '/doctor/reports' },
  ];

  const adminNavItems = [
    { label: 'Admin Panel', href: '/admin/dashboard' },
    { label: 'Doctor Verification', href: '/admin/verification' },
    { label: 'Doctor Profile', href: '/doctors/profile' },
  ];

  const authNavItems =
    role === 'PATIENT'
      ? patientNavItems
      : role === 'DOCTOR'
        ? doctorNavItems
        : role === 'ADMIN'
          ? adminNavItems
          : [];

  const baseDisplayItems = isAuthPage
    ? []
    : isLandingPage && (!isAuthenticated || role === 'DOCTOR')
      ? doctorLandingStaticNavItems
      : isAuthenticated && role === 'PATIENT'
        ? guestNavItems
        : isAuthenticated
          ? authNavItems
          : guestNavItems;

  const displayItems = role === 'DOCTOR' && isDoctorCompactNavRoute ? [] : baseDisplayItems;

  const currentUser = getAuthUser();
  const doctorUser = role === 'DOCTOR' ? currentUser : null;
  const doctorDisplayName = doctorUser
    ? `${doctorUser.firstName || ''} ${doctorUser.lastName || ''}`.trim() || doctorUser.email || 'Doctor'
    : 'Doctor';
  const doctorEmail = doctorUser?.email || '';
  const doctorInitial = doctorDisplayName.charAt(0).toUpperCase() || 'D';

  const patientUser = role === 'PATIENT' ? getAuthUser() : null;
  const patientDisplayName = patientUser
    ? `${patientUser.firstName || ''} ${patientUser.lastName || ''}`.trim() ||
      patientUser.email ||
      'Patient'
    : 'Patient';
  const patientEmail = patientUser?.email || '';
  const patientInitial = patientDisplayName.charAt(0).toUpperCase() || 'P';

  const patientServiceLinks = [
    { label: 'Profile', href: '/profile' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Book Appointment', href: '/appointments/book' },
    { label: 'My Appointments', href: '/appointments' },
    { label: 'MedicalReports', href: '/reports' },
    { label: 'MedicalHistory', href: '/history' },
    { label: 'AI Symptom', href: '/ai-symptom' },
    { label: 'Prescription', href: '/prescriptions' },
    { label: 'Discover Doctors', href: '/doctors' },
  ];

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login');
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/20'
          : isLandingPage
            ? 'bg-gradient-to-b from-black/50 to-transparent'
            : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="flex items-center justify-center">
              <img src="/fav.png" alt="Clinexa" className="h-10 w-10" />
            </motion.div>
            <span className={`text-xl font-bold hidden sm:inline transition-colors ${
              isLandingPage && !scrolled
                ? 'text-white'
                : 'bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent'
            }`}>
              Clinexa
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {displayItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`relative group font-medium transition-colors ${
                  isLandingPage && !scrolled ? 'text-white hover:text-cyan-400' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {item.label}
                <motion.div
                  className={`absolute bottom-0 left-0 w-0 h-0.5 group-hover:w-full ${
                    isLandingPage && !scrolled ? 'bg-cyan-400' : 'bg-gradient-to-r from-blue-600 to-cyan-500'
                  }`}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {!isAuthenticated ? (
              !isAuthPage && (
                <>
                  <Link
                    to="/login"
                    className={`px-4 py-2 font-medium transition-colors ${
                      isLandingPage && !scrolled
                        ? 'text-white hover:text-cyan-400'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                  >
                    Sign Up
                  </Link>
                </>
              )
            ) : role === 'PATIENT' ? (
              <div className="flex items-center gap-3">
                <NotificationBell />
                <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                    isLandingPage && !scrolled
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {patientAvatarUrl ? (
                    <img src={patientAvatarUrl} alt="Patient avatar" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold flex items-center justify-center">
                      {patientInitial}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-sm font-semibold leading-tight">{patientDisplayName}</p>
                    {patientEmail && <p className="text-xs opacity-80 leading-tight">{patientEmail}</p>}
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                    {patientServiceLinks.map((item) => (
                      <Link
                        key={item.label}
                        to={item.href}
                        onClick={() => setIsProfileOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        {item.label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
                </div>
              </div>
            ) : role === 'DOCTOR' && (isDoctorWorkspaceRoute || isLandingPage) ? (
              <div className="flex items-center gap-3">
                <NotificationBell />
                <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    if (isLandingPage) {
                      return;
                    }
                    setIsDoctorMenuOpen((prev) => !prev);
                  }}
                  aria-expanded={isDoctorMenuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {doctorAvatarUrl ? (
                    <img src={doctorAvatarUrl} alt="Doctor avatar" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-gradient-to-r from-teal-600 to-cyan-500 text-white text-sm font-semibold flex items-center justify-center">
                      {doctorInitial}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-sm font-semibold leading-tight">{doctorDisplayName}</p>
                    <p className="text-xs text-gray-500 leading-tight">Doctor{doctorEmail ? ` · ${doctorEmail}` : ''}</p>
                  </div>
                  {!isLandingPage && (
                    <ChevronDown className={`h-4 w-4 transition-transform ${isDoctorMenuOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {!isLandingPage && isDoctorMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-xl" role="menu">
                    <Link
                      to="/dashboard"
                      role="menuitem"
                      onClick={() => setIsDoctorMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/doctor/appointments"
                      role="menuitem"
                      onClick={() => setIsDoctorMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Appointments
                    </Link>
                    <Link
                      to="/doctor/reports"
                      role="menuitem"
                      onClick={() => setIsDoctorMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Patient Reports
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsDoctorMenuOpen(false);
                        handleLogout();
                      }}
                      className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
                </div>
              </div>
            ) : (
              <>
                <Link
                  to={role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}
                  className={`px-4 py-2 font-medium transition-colors ${
                    isLandingPage && !scrolled
                      ? 'text-white hover:text-cyan-400'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className={`w-6 h-6 ${isLandingPage && !scrolled ? 'text-white' : 'text-gray-700'}`} />
            ) : (
              <Menu className={`w-6 h-6 ${isLandingPage && !scrolled ? 'text-white' : 'text-gray-700'}`} />
            )}
          </motion.button>
        </div>

        <motion.nav
          initial={false}
          animate={isOpen ? 'open' : 'closed'}
          variants={{
            open: { opacity: 1, height: 'auto' },
            closed: { opacity: 0, height: 0 },
          }}
          className="md:hidden overflow-hidden border-t border-gray-200/20"
        >
          <div className="px-4 py-4 space-y-2">
            {displayItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {isAuthenticated && (role === 'PATIENT' || role === 'DOCTOR') && (
              <Link
                to="/notifications"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Notifications
              </Link>
            )}
            {!isAuthenticated ? (
              <div className="pt-4 border-t border-gray-200/20 space-y-2">
                <Link
                  to="/login"
                  className={`block px-4 py-2 rounded-lg transition-colors ${
                    isLandingPage && !scrolled
                      ? 'text-white hover:bg-white/10'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg text-center font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            ) : role === 'PATIENT' ? (
              <div className="pt-4 border-t border-gray-200/20 space-y-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg bg-gray-100 px-4 py-3 text-left text-gray-800"
                  onClick={() => setIsPatientMobileMenuOpen((prev) => !prev)}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    {patientAvatarUrl ? (
                      <img src={patientAvatarUrl} alt="Patient avatar" className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <UserCircle2 className="h-5 w-5" />
                    )}
                    {patientDisplayName}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isPatientMobileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isPatientMobileMenuOpen && (
                  <div className="space-y-1 rounded-lg border border-gray-200 bg-white p-2">
                    {patientServiceLinks.map((item) => (
                      <Link
                        key={item.label}
                        to={item.href}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setIsOpen(false);
                          setIsPatientMobileMenuOpen(false);
                        }}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"
                      onClick={() => {
                        setIsOpen(false);
                        setIsPatientMobileMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : role === 'DOCTOR' && isDoctorWorkspaceRoute ? (
              <div className="pt-4 border-t border-gray-200/20 space-y-2">
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-800">
                  <p className="text-sm font-semibold">{doctorDisplayName}</p>
                  <p className="text-xs text-gray-500">Doctor{doctorEmail ? ` · ${doctorEmail}` : ''}</p>
                </div>
                <Link
                  to="/dashboard"
                  className="block w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-center font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                >
                  Dashboard
                </Link>
                <Link
                  to="/doctor/appointments"
                  className="block w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-center font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                >
                  Appointments
                </Link>
                <button
                  type="button"
                  className="block w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg text-center font-medium"
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-200/20 space-y-2">
                <button
                  type="button"
                  className="block w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg text-center font-medium"
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </motion.nav>
      </div>
    </motion.header>
  );
}
