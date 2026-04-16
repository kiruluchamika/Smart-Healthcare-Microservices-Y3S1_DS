import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authApi';
import { setAuthSession } from '../services/authSession';
import { patientApi } from '../services/patientApi';
import { isPatientProfileComplete } from '../utils/patientProfile';

interface LoginFormProps {
  onSwitch: () => void;
}

export function LoginForm({ onSwitch }: LoginFormProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setServerError('');

    try {
      const response = await login(email, password);
      setAuthSession(response);

      let redirectPath = '/dashboard';
      let navigationState: Record<string, unknown> | undefined;

      if (response.user.role === 'PATIENT') {
        try {
          const profileResponse = await patientApi.getProfile();
          if (!isPatientProfileComplete(profileResponse.data)) {
            redirectPath = '/profile';
            navigationState = { onboarding: true };
          }
        } catch {
          redirectPath = '/profile';
          navigationState = { onboarding: true };
        }
      }

      setIsLoading(false);
      setEmail('');
      setPassword('');
      navigate(redirectPath, { state: navigationState });
    } catch (error) {
      setIsLoading(false);
      setServerError(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <motion.h2 variants={itemVariants} className="text-3xl font-bold text-white mb-2">
        Welcome Back
      </motion.h2>
      <motion.p variants={itemVariants} className="text-gray-400 mb-8">
        Sign in to your account to continue
      </motion.p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {serverError && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm"
          >
            {serverError}
          </motion.p>
        )}

        <motion.div variants={itemVariants} className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className={`w-full bg-white/10 border-b-2 py-3 px-0 focus:outline-none placeholder-gray-500 text-white transition-colors ${
              errors.email ? 'border-red-500' : 'border-gray-600 focus:border-cyan-400'
            }`}
          />
          {errors.email && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm mt-1"
            >
              {errors.email}
            </motion.p>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="relative">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={`w-full bg-white/10 border-b-2 py-3 px-0 focus:outline-none placeholder-gray-500 text-white transition-colors ${
                errors.password ? 'border-red-500' : 'border-gray-600 focus:border-cyan-400'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-3 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm mt-1"
            >
              {errors.password}
            </motion.p>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="flex items-center justify-between pt-2">
          <label className="flex items-center cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded bg-white/10 border-gray-600" />
            <span className="ml-3 text-gray-400 text-sm">Remember me</span>
          </label>
          <a href="#" className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors">
            Forgot password?
          </a>
        </motion.div>

        <motion.button
          variants={itemVariants}
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </motion.button>
      </form>

      <motion.div variants={itemVariants} className="mt-8 text-center">
        <p className="text-gray-400">
          Don't have an account?{' '}
          <button
            onClick={onSwitch}
            className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
          >
            Create one
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}
