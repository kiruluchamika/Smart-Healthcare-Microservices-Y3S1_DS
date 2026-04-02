import { useMemo, useState } from 'react';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../../services/authApi';
import { clearAuthSession, setAuthSession } from '../../services/authSession';

interface FormState {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const emailHint = useMemo(() => form.email.trim(), [form.email]);

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = 'Admin email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Please enter a valid email address';
    }

    if (!form.password) {
      nextErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError('');

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await adminLogin(form.email.trim(), form.password);
      setAuthSession(response);

      if (response.user.role !== 'ADMIN') {
        clearAuthSession();
        throw new Error('This account does not have admin access');
      }

      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Admin login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#071a33] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(42,140,255,0.25),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(16,212,156,0.2),transparent_30%),radial-gradient(circle_at_50%_90%,rgba(255,199,84,0.16),transparent_45%)]" />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/20 p-2 text-cyan-300">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Admin Login</h1>
            <p className="text-sm text-slate-300">Secure access to management console</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {serverError && <p className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-200">{serverError}</p>}

          <div>
            <label htmlFor="admin-email" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-300">
              Admin Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="admin@company.com"
              className={`w-full rounded-xl border bg-white/10 px-3 py-2.5 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                errors.email ? 'border-rose-400 focus:ring-rose-400/30' : 'border-slate-500 focus:ring-cyan-400/30'
              }`}
            />
            {errors.email && <p className="mt-1 text-xs text-rose-300">{errors.email}</p>}
            {!errors.email && emailHint && <p className="mt-1 text-xs text-slate-400">Signing in as {emailHint}</p>}
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-300">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Enter password"
                className={`w-full rounded-xl border bg-white/10 px-3 py-2.5 pr-11 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  errors.password ? 'border-rose-400 focus:ring-rose-400/30' : 'border-slate-500 focus:ring-cyan-400/30'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-rose-300">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 font-semibold text-white transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Signing in...' : 'Sign in to Admin Panel'}
          </button>
        </form>
      </div>
    </div>
  );
}
