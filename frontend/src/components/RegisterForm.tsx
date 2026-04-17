import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/authApi';
import { setAuthSession } from '../services/authSession';
import { patientApi } from '../services/patientApi';
import { LAST_NAME_PLACEHOLDER } from '../utils/name';
import { isPatientProfileComplete } from '../utils/patientProfile';

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

const NAME_PATTERN = /^[A-Za-z ]+$/;
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
      newErrors.name = 'Name can only contain letters and spaces';
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

      navigate(redirectPath, { state: navigationState });
    } catch (error) {
      setIsLoading(false);
      setServerError(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  const strengthColor: Record<number, string> = {
    0: 'bg-gray-300',
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-yellow-500',
    4: 'bg-green-500',
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Join Clinexa</h2>
      <p className="text-gray-600 mb-8">Create your account to get started</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="bg-red-50 border border-red-200/30 rounded-lg p-4 text-red-700 text-sm">
            {serverError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-3.5 w-5 h-5 text-blue-600" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-gray-50/50 text-gray-900 ${
                errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
              }`}
            />
          </div>
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
           <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-blue-600" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-gray-50/50 text-gray-900 ${
                errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
              }`}
            />
          </div>
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Register as</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as RegisterRole)}
            className="w-full bg-gray-50/50 border border-gray-200 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all appearance-none"
          >
            <option value="PATIENT">Patient</option>
            <option value="DOCTOR">Doctor</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <div className="relative">
             <Lock className="absolute left-4 top-3.5 w-5 h-5 text-blue-600" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-gray-50/50 text-gray-900 ${
                errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-blue-600 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          
          {password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(strength / 4) * 100}%` }}
                  transition={{ duration: 0.3 }}
                  className={`h-full ${strengthColor[strength] || 'bg-gray-300'}`}
                />
              </div>
              <span className="text-xs font-semibold text-gray-500 w-12 text-right">
                {strengthLabels[strength]}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-blue-600" />
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-gray-50/50 text-gray-900 ${
                errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-blue-600 transition-colors"
            >
              {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
        </div>

        <div className="flex items-start pt-2">
          <input type="checkbox" className="w-4 h-4 rounded text-blue-600 border-gray-300 mt-0.5 focus:ring-blue-500" required />
          <span className="ml-2 text-sm text-gray-600">
            I agree to the{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Privacy Policy</a>
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={isLoading}
          className="w-full mt-6 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 disabled:opacity-70 text-white font-semibold py-3 rounded-lg shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </motion.button>
      </form>

      <div className="mt-6 text-center text-sm">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button onClick={onSwitch} className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
