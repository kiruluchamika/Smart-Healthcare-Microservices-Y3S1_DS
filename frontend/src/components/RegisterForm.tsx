import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/authApi';
import { setAuthSession } from '../services/authSession';
import { LAST_NAME_PLACEHOLDER } from '../utils/name';

interface RegisterFormProps {
  onSwitch: () => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

type RegisterRole = 'PATIENT' | 'DOCTOR';

const NAME_PATTERN = /^[A-Za-z -]+$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._#^()\-+=])[A-Za-z\d@$!%*?&._#^()\-+=]{8,64}$/;

export function RegisterForm({ onSwitch }: RegisterFormProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RegisterRole>('PATIENT');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return Math.min(strength, 4);
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    const normalizedName = name.trim();

    if (!normalizedName) {
      newErrors.name = 'Full name is required';
    } else if (normalizedName.length < 2) {
      newErrors.name = 'Full name must be at least 2 characters';
    } else if (!NAME_PATTERN.test(normalizedName)) {
      newErrors.name = 'Name can only contain letters, spaces, and hyphens';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!PASSWORD_PATTERN.test(password)) {
      newErrors.password = 'Use 8+ chars with uppercase, lowercase, number, and special character';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setServerError('');

    const parts = name.trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || '';
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : LAST_NAME_PLACEHOLDER;

    try {
      const response = await register({
        email,
        password,
        firstName,
        lastName,
        role,
      });

      setAuthSession(response);

      setIsLoading(false);
      navigate('/dashboard');
    } catch (error) {
      setIsLoading(false);
      setServerError(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const strengthColor: Record<number, string> = {
    0: 'bg-gray-500',
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-yellow-500',
    4: 'bg-green-500',
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <motion.h2 variants={itemVariants} className="text-3xl font-bold text-white mb-2">
        Join Clinexa
      </motion.h2>
      <motion.p variants={itemVariants} className="text-gray-400 mb-8">
        Create your account to get started
      </motion.p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className={`w-full bg-white/10 border-b-2 py-3 px-0 focus:outline-none placeholder-gray-500 text-white transition-colors ${
              errors.name ? 'border-red-500' : 'border-gray-600 focus:border-cyan-400'
            }`}
          />
          {errors.name && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm mt-1"
            >
              {errors.name}
            </motion.p>
          )}
        </motion.div>

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
          <label className="block text-xs uppercase tracking-wide text-gray-400 mb-2">
            Register as
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as RegisterRole)}
            className="w-full bg-white/10 border-b-2 border-gray-600 py-3 px-0 focus:outline-none focus:border-cyan-400 text-white transition-colors"
          >
            <option value="PATIENT" className="text-gray-900">Patient</option>
            <option value="DOCTOR" className="text-gray-900">Doctor</option>
          </select>
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
          {password && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 flex items-center gap-2"
            >
              <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(strength / 4) * 100}%` }}
                  transition={{ duration: 0.3 }}
                  className={`h-full ${strengthColor[strength] || 'bg-gray-500'}`}
                />
              </div>
              <span className="text-xs font-semibold text-gray-400">
                {strengthLabels[strength]}
              </span>
            </motion.div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="relative">
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className={`w-full bg-white/10 border-b-2 py-3 px-0 focus:outline-none placeholder-gray-500 text-white transition-colors ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-600 focus:border-cyan-400'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-0 top-3 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm mt-1"
            >
              {errors.confirmPassword}
            </motion.p>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="flex items-start pt-2">
          <input type="checkbox" className="w-4 h-4 rounded bg-white/10 border-gray-600 mt-1" />
          <span className="ml-3 text-gray-400 text-sm">
            I agree to the{' '}
            <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              Privacy Policy
            </a>
          </span>
        </motion.div>

        <motion.button
          variants={itemVariants}
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </motion.button>
      </form>

      <motion.div variants={itemVariants} className="mt-6 text-center">
        <p className="text-gray-400">
          Already have an account?{' '}
          <button
            onClick={onSwitch}
            className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
          >
            Sign in
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}
