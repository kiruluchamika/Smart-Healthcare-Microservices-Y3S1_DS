import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { VerificationTimeline } from '../../components/doctor/VerificationTimeline';
import { DOCTOR_VERIFICATION_STATUSES } from '../../constants/doctor';
import { getVerificationHistory, updateVerificationStatus } from '../../services/doctor/doctorApi';
import { isAdminUser } from '../../services/authSession';
import type { DoctorVerificationHistoryItem, DoctorVerificationStatus } from '../../types/doctor';

export default function DoctorVerificationAdmin() {
  const [doctorId, setDoctorId] = useState('');
  const [status, setStatus] = useState<DoctorVerificationStatus>('PENDING');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState<DoctorVerificationHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isAdminUser()) {
    return <Navigate to="/dashboard" replace />;
  }

  const loadHistory = async (numericDoctorId: number) => {
    const result = await getVerificationHistory(numericDoctorId);
    setHistory(result);
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();

    const numericDoctorId = Number(doctorId);
    if (!numericDoctorId) {
      setMessage('Provide a valid doctor id.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await updateVerificationStatus(numericDoctorId, {
        verificationStatus: status,
        reason: reason || undefined,
        notes: notes || undefined,
      });
      await loadHistory(numericDoctorId);
      setMessage('Verification status updated successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update verification status.');
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryLookup = async () => {
    const numericDoctorId = Number(doctorId);
    if (!numericDoctorId) {
      setMessage('Provide a valid doctor id to fetch history.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await loadHistory(numericDoctorId);
      setMessage('Verification history loaded.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to fetch verification history.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-50 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4" />
            Admin-only verification controls
          </p>
          <p className="mt-1">This page sends admin Basic Auth requests to doctor-service verification endpoints.</p>
        </div>

        <form onSubmit={handleUpdate} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-4 text-2xl font-black text-slate-900">Doctor Verification Admin</h1>

          {message && (
            <p className={`mb-4 rounded-lg px-3 py-2 text-sm ${message.toLowerCase().includes('failed') || message.toLowerCase().includes('valid') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {message}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Doctor id</span>
              <input
                type="number"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">New status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DoctorVerificationStatus)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                {DOCTOR_VERIFICATION_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="md:col-span-2 block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Reason</span>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>

            <label className="md:col-span-2 block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-slate-800 to-slate-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'Submitting...' : 'Update status'}
            </button>
            <button
              type="button"
              onClick={() => void handleHistoryLookup()}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Load history
            </button>
          </div>
        </form>

        <div className="mt-6">
          <VerificationTimeline items={history} />
        </div>
      </div>
    </div>
  );
}
