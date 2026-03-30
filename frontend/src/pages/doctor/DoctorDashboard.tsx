import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, BarChart3, Gauge, ShieldCheck } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { DoctorStatusBadge } from '../../components/doctor/DoctorStatusBadge';
import { getDashboardSummary } from '../../services/doctor/doctorApi';
import type { DoctorDashboardSummary } from '../../types/doctor';

export default function DoctorDashboard() {
  const params = useParams();
  const doctorId = Number(params.id || 0);

  const [summary, setSummary] = useState<DoctorDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSummary = async () => {
      if (!doctorId) {
        setError('Invalid doctor id.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const result = await getDashboardSummary(doctorId);
        setSummary(result);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Failed to load doctor dashboard summary.');
      } finally {
        setLoading(false);
      }
    };

    void loadSummary();
  }, [doctorId]);

  const weekEntries = useMemo(() => Object.entries(summary?.weeklySlotCount || {}), [summary?.weeklySlotCount]);
  const maxSlots = useMemo(() => Math.max(...weekEntries.map(([, count]) => count), 1), [weekEntries]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#ccfbf1,transparent_40%),linear-gradient(180deg,#f8fafc_0%,#ffffff_80%)] px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-black text-slate-900 sm:text-4xl">Doctor Dashboard Summary</h1>
        <p className="mb-6 text-sm text-slate-600">Live data from /dashboard-summary endpoint.</p>

        {loading && <div className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white" />}
        {!loading && error && <p className="rounded-xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p>}

        {!loading && summary && (
          <>
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Doctor</p>
                  <h2 className="text-2xl font-black text-slate-900">{summary.doctorName}</h2>
                  <p className="text-sm text-slate-600">{summary.specialization}</p>
                </div>
                <DoctorStatusBadge status={summary.verificationStatus} />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <ShieldCheck className="mb-2 h-5 w-5 text-teal-600" />
                  <p className="text-xs text-slate-500">Profile Active</p>
                  <p className="text-xl font-bold text-slate-900">{summary.active ? 'Yes' : 'No'}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <Gauge className="mb-2 h-5 w-5 text-teal-600" />
                  <p className="text-xs text-slate-500">Completeness</p>
                  <p className="text-xl font-bold text-slate-900">{summary.profileCompletenessScore}%</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <BarChart3 className="mb-2 h-5 w-5 text-teal-600" />
                  <p className="text-xs text-slate-500">Total Slots</p>
                  <p className="text-xl font-bold text-slate-900">{summary.totalSlots}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <Activity className="mb-2 h-5 w-5 text-teal-600" />
                  <p className="text-xs text-slate-500">Available Slots</p>
                  <p className="text-xl font-bold text-slate-900">{summary.availableSlots}</p>
                </div>
              </div>
            </motion.section>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-slate-900">Weekly Slot Distribution</h3>
                <div className="space-y-3">
                  {weekEntries.map(([day, count]) => (
                    <div key={day}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-700">{day}</span>
                        <span className="text-slate-500">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-orange-400"
                          style={{ width: `${(count / maxSlots) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {!weekEntries.length && <p className="text-sm text-slate-600">No weekly breakdown available.</p>}
                </div>
              </section>

              <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-2 text-lg font-bold text-slate-900">Profile Insight</h3>
                <p className="text-sm leading-6 text-slate-700">{summary.profileInsight}</p>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
