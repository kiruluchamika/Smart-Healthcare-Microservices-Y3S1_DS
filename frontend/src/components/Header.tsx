import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Heart } from 'lucide-react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isLandingPage = location.pathname === '/';

  window.addEventListener('scroll', () => {
    setScrolled(window.scrollY > 50);
  });

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/#services' },
    { label: 'About', href: '/#about' },
    { label: 'Contact', href: '/#contact' },
  ];

  const authNavItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Appointments', href: '/appointments' },
    { label: 'Profile', href: '/profile' },
  ];

  const displayItems = isAuthPage ? [] : navItems;

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
              className="bg-gradient-to-br from-blue-600 to-cyan-500 p-2 rounded-xl"
            >
              <Heart className="w-6 h-6 text-white" />
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
            {isAuthPage ? (
              displayItems.length === 0 && (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-gray-700 font-medium hover:text-blue-600 transition-colors"
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
            <div className="pt-4 border-t border-gray-200/20 space-y-2">
              <Link
                to="/login"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
          </div>
        </motion.nav>
      </div>
    </motion.header>
  );
}
