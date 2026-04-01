import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, Menu, UserCircle2, X } from 'lucide-react';
import { patientApi } from '../services/patientApi';
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
  const [isPatientMobileMenuOpen, setIsPatientMobileMenuOpen] = useState(false);
  const [patientAvatarUrl, setPatientAvatarUrl] = useState<string | null>(null);
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

  const guestNavItems = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/#services' },
    { label: 'About', href: '/#about' },
    { label: 'Contact', href: '/#contact' },
  ];

  const baseAuthNavItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Profile', href: '/profile' },
    { label: 'Appointments', href: '/appointments' },
    { label: 'Reports', href: '/reports' },
    { label: 'History', href: '/history' },
  ];

  const patientDoctorDiscoveryItems = [
    { label: 'Discover Doctors', href: '/doctors' },
  ];

  const doctorOperationalItems = [
    { label: 'Doctor Profile', href: '/doctors/profile' },
  ];

  const adminNavItems = [
    { label: 'Admin Panel', href: '/admin/dashboard' },
    { label: 'Doctor Verification', href: '/admin/verification' },
  ];

  const authNavItems = [
    ...baseAuthNavItems,
    ...(role === 'PATIENT' ? patientDoctorDiscoveryItems : []),
    ...(role === 'DOCTOR' ? doctorOperationalItems : []),
    ...(role === 'ADMIN' ? [...doctorOperationalItems, ...adminNavItems] : []),
  ];

  const displayItems = isAuthPage ? [] : isAuthenticated && role === 'PATIENT' ? guestNavItems : isAuthenticated ? authNavItems : guestNavItems;

  const patientUser = role === 'PATIENT' ? getAuthUser() : null;
  const patientDisplayName = patientUser
    ? `${patientUser.firstName || ''} ${patientUser.lastName || ''}`.trim() || patientUser.email || 'Patient'
    : 'Patient';
  const patientEmail = patientUser?.email || '';
  const patientInitial = patientDisplayName.charAt(0).toUpperCase() || 'P';

  const patientServiceLinks = [
    { label: 'Profile', href: '/profile' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Appointments', href: '/appointments' },
    { label: 'MedicalReports', href: '/reports' },
    { label: 'MedicalHistory', href: '/history' },
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
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center"
            >
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
            ) : (
              role === 'PATIENT' ? (
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
              )
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
            ) : (
              role === 'PATIENT' ? (
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
              )
            )}
          </div>
        </motion.nav>
      </div>
    </motion.header>
  );
}
