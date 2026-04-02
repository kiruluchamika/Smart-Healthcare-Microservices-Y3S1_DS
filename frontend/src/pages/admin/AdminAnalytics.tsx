import { useEffect, useMemo, useState } from 'react';
import { getAdminOverview } from '../../services/adminApi';
import type { AdminOverviewResponse } from '../../types/admin';

export default function AdminAnalytics() {
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError('');

      try {
        const payload = await getAdminOverview();
        setOverview(payload);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, []);

  const composition = useMemo(() => {
    if (!overview || overview.totalUsers === 0) {
      return [
        { label: 'Admins', value: 0 },
        { label: 'Doctors', value: 0 },
        { label: 'Patients', value: 0 },
      ];
    }

    return [
      { label: 'Admins', value: Math.round((overview.adminUsers / overview.totalUsers) * 100) },
      { label: 'Doctors', value: Math.round((overview.doctorUsers / overview.totalUsers) * 100) },
      { label: 'Patients', value: Math.round((overview.patientUsers / overview.totalUsers) * 100) },
    ];
  }, [overview]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black text-slate-900">Platform Analytics</h2>
      {error && <p className="rounded-xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">User Composition</h3>
        {isLoading && <p className="mt-4 text-sm text-slate-500">Loading analytics...</p>}

        {!isLoading && (
          <div className="mt-4 space-y-3">
            {composition.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="font-semibold text-slate-900">{item.value}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    style={{ width: `${Math.min(Math.max(item.value, 0), 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Active Accounts</h3>
          <p className="mt-2 text-3xl font-black text-slate-900">{isLoading || !overview ? '...' : overview.enabledUsers}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Disabled Accounts</h3>
          <p className="mt-2 text-3xl font-black text-slate-900">{isLoading || !overview ? '...' : overview.disabledUsers}</p>
        </div>
      </div>
    </div>
  );
}
