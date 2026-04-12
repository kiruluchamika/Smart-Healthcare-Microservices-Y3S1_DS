import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Stethoscope, UserCircle2, Users } from 'lucide-react';
import { getAdminOverview } from '../../services/adminApi';
import type { AdminOverviewResponse } from '../../types/admin';
import { formatAdminMetricValue } from '../../utils/admin/adminMetricFormatter';

const metricConfig = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, tone: 'from-blue-500 to-blue-600' },
  { key: 'adminUsers', label: 'Admins', icon: ShieldCheck, tone: 'from-amber-500 to-orange-500' },
  { key: 'doctorUsers', label: 'Doctors', icon: Stethoscope, tone: 'from-emerald-500 to-green-600' },
  { key: 'patientUsers', label: 'Patients', icon: UserCircle2, tone: 'from-cyan-500 to-sky-600' },
] as const;

export default function AdminDashboard() {
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadOverview = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await getAdminOverview();
        if (mounted) {
          setOverview(data);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load admin overview');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadOverview();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-[#0c2f5d] via-[#164073] to-[#1d5f8f] p-6 text-white shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">Control Center</p>
        <h2 className="mt-1 text-3xl font-black">Platform Administration</h2>
        <p className="mt-2 max-w-2xl text-sm text-cyan-100/90">
          Monitor users, validate doctors, and manage core configuration from one place.
        </p>
      </section>

      {error && <p className="rounded-xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricConfig.map((metric) => {
          const Icon = metric.icon;
          const rawValue = overview ? overview[metric.key] : 0;
          const formattedValue = isLoading ? '...' : formatAdminMetricValue(metric.key, rawValue);

          return (
            <article key={metric.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                <div className={`rounded-xl bg-gradient-to-r p-2 text-white ${metric.tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-black text-slate-900">{formattedValue}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">System Health</h3>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Core Services</p>
                <p className="text-xs text-slate-500">Auth, patient and doctor APIs connected</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Healthy</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Quick Actions</h3>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link to="/admin/verification" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
              Verify doctors
            </Link>
            <Link to="/admin/users" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
              Manage users
            </Link>
            <Link to="/admin/analytics" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
              View analytics
            </Link>
            <Link to="/admin/settings" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
              System settings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
