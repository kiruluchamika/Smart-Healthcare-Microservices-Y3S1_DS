import { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Clock, Mail, Phone, Briefcase, Award } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { VerificationTimeline } from '../../components/doctor/VerificationTimeline';
import { DOCTOR_VERIFICATION_STATUSES } from '../../constants/doctor';
import { decideDoctorChangeRequest, getDoctorById, getDoctors, getVerificationHistory, updateVerificationStatus } from '../../services/doctor/doctorApi';
import { isAdminUser } from '../../services/authSession';
import type { DoctorVerificationHistoryItem, DoctorVerificationStatus, DoctorServiceDoctor, PagedResponse } from '../../types/doctor';

const CHANGE_REQUEST_PREFIX = 'PROFILE_CHANGE_REQUEST';

function isChangeRequestEntry(item: DoctorVerificationHistoryItem) {
  const reason = (item.reason || '').toUpperCase().trim();
  return reason === CHANGE_REQUEST_PREFIX || reason.startsWith(`${CHANGE_REQUEST_PREFIX}:`);
}

function isChangeRequestDecisionEntry(item: DoctorVerificationHistoryItem) {
  const reason = (item.reason || '').toUpperCase().trim();
  return reason.startsWith(`${CHANGE_REQUEST_PREFIX}_DECISION`);
}

function cleanedChangeRequestReason(reason?: string) {
  if (!reason) {
    return '';
  }
  return reason.replace(/^PROFILE_CHANGE_REQUEST:\s*/i, '').replace(/^PROFILE_CHANGE_REQUEST\s*/i, '').trim();
}

function isResolvedChangeRequest(item: DoctorVerificationHistoryItem) {
  const notes = item.notes || '';
  return notes.includes('Resolution: APPROVE') || notes.includes('Resolution: REJECT');
}

export default function DoctorVerificationAdmin() {
  const [doctors, setDoctors] = useState<DoctorServiceDoctor[]>([]);
  const [doctorPendingRequestCount, setDoctorPendingRequestCount] = useState<Record<number, number>>({});
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorServiceDoctor | null>(null);
  const [history, setHistory] = useState<DoctorVerificationHistoryItem[]>([]);
  const [status, setStatus] = useState<DoctorVerificationStatus>('PENDING');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [historyView, setHistoryView] = useState<'ALL' | 'CHANGE_REQUESTS' | 'STATUS_UPDATES'>('ALL');
  const [pageSize] = useState(20);

  if (!isAdminUser()) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const response = await getDoctors({ page: 0, size: pageSize, sortBy: 'createdAt', sortDir: 'desc' });
      setDoctors(response.content);

      const pendingCounts = await Promise.all(
        response.content.map(async (doctor) => {
          try {
            const items = await getVerificationHistory(doctor.id, 'admin');
            const pendingCount = items.filter((entry) => isChangeRequestEntry(entry) && !isResolvedChangeRequest(entry)).length;
            return [doctor.id, pendingCount] as const;
          } catch {
            return [doctor.id, 0] as const;
          }
        }),
      );

      setDoctorPendingRequestCount(
        pendingCounts.reduce<Record<number, number>>((acc, [doctorId, count]) => {
          acc[doctorId] = count;
          return acc;
        }, {}),
      );

      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (doctorId: number) => {
    try {
      const result = await getVerificationHistory(doctorId, 'admin');
      setHistory(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load verification history.');
    }
  };

  const handleChangeRequestDecision = async (
    requestId: number,
    action: 'APPROVE' | 'REJECT',
  ) => {
    if (!selectedDoctor) {
      return;
    }

    const note = window.prompt(
      action === 'APPROVE'
        ? 'Optional admin note for approval:'
        : 'Reason for rejection (recommended):',
      '',
    );

    setLoading(true);
    setMessage('');

    try {
      const result = await decideDoctorChangeRequest(selectedDoctor.id, requestId, {
        action,
        adminNotes: note?.trim() || undefined,
      });

      await loadHistory(selectedDoctor.id);
      const refreshedDoctor = await getDoctorById(selectedDoctor.id);
      setSelectedDoctor(refreshedDoctor);
      await loadDoctors();
      setMessage(result.message || `Change request ${action.toLowerCase()}d successfully.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to process change request.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = (doctor: DoctorServiceDoctor) => {
    setSelectedDoctor(doctor);
    setStatus(doctor.verificationStatus);
    setReason('');
    setNotes('');
    loadHistory(doctor.id);
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedDoctor) {
      setMessage('Select a doctor first.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await updateVerificationStatus(selectedDoctor.id, {
        verificationStatus: status,
        reason: reason || undefined,
        notes: notes || undefined,
      });
      await loadHistory(selectedDoctor.id);
      await loadDoctors();
      setMessage('Verification status updated successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update verification status.');
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(
    (doc) => filter === 'ALL' || doc.verificationStatus === filter
  );

  const changeRequestItems = history.filter((entry) => isChangeRequestEntry(entry) && !isChangeRequestDecisionEntry(entry));

  const visibleHistory = history.filter((item) => {
    if (historyView === 'CHANGE_REQUESTS') {
      return isChangeRequestEntry(item) && !isChangeRequestDecisionEntry(item);
    }
    if (historyView === 'STATUS_UPDATES') {
      return !isChangeRequestEntry(item);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-50 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4" />
            Doctor Verification Management
          </p>
          <p className="mt-1">Review and approve/reject doctor profiles below.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Doctors List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-2xl font-black text-slate-900">Doctors to Verify</h1>
              <button
                onClick={loadDoctors}
                disabled={loading}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>

            {message && (
              <p className={`mb-4 rounded-lg px-3 py-2 text-sm ${message.toLowerCase().includes('failed') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {message}
              </p>
            )}

            {/* Filter Tabs */}
            <div className="mb-4 flex gap-2 border-b border-slate-200">
              {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 font-semibold transition ${
                    filter === f
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Doctors Grid */}
            <div className="space-y-3 max-h-[800px] overflow-y-auto">
              {filteredDoctors.length === 0 && (
                <p className="py-8 text-center text-slate-500">No doctors found with status: {filter}</p>
              )}

              {filteredDoctors.map((doctor) => (
                <button
                  key={doctor.id}
                  onClick={() => handleSelectDoctor(doctor)}
                  className={`w-full rounded-xl border-2 p-4 text-left transition ${
                    selectedDoctor?.id === doctor.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{doctor.firstName} {doctor.lastName}</p>
                      <p className="text-xs text-slate-600">{doctor.email}</p>
                      <p className="text-sm text-slate-700 mt-1">{doctor.specialization}</p>
                      {(doctorPendingRequestCount[doctor.id] || 0) > 0 && (
                        <p className="mt-2 inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                          {doctorPendingRequestCount[doctor.id]} new change request{doctorPendingRequestCount[doctor.id] > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {doctor.verificationStatus === 'APPROVED' && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                      {doctor.verificationStatus === 'REJECTED' && <XCircle className="h-5 w-5 text-rose-600" />}
                      {doctor.verificationStatus === 'PENDING' && <Clock className="h-5 w-5 text-amber-600" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Doctor Details & Verification Form */}
          {selectedDoctor && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
              <h2 className="mb-4 text-xl font-bold text-slate-900">Doctor Details</h2>

              {/* Doctor Info Card */}
              <div className="mb-6 space-y-3 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-600">{selectedDoctor.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-600">{selectedDoctor.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-600">{selectedDoctor.experienceYears} years exp.</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-600">{selectedDoctor.qualifications}</span>
                </div>
              </div>

              {/* Verification Status Badge */}
              <div className="mb-6 rounded-xl bg-slate-100 p-3 text-center">
                <p className="text-xs text-slate-600 mb-1">Current Status</p>
                <p className={`font-bold text-lg ${
                  selectedDoctor.verificationStatus === 'APPROVED' ? 'text-emerald-600' :
                  selectedDoctor.verificationStatus === 'REJECTED' ? 'text-rose-600' :
                  'text-amber-600'
                }`}>
                  {selectedDoctor.verificationStatus}
                </p>
              </div>

              {/* Verification Form */}
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">New Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DoctorVerificationStatus)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DOCTOR_VERIFICATION_STATUSES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Reason (optional)</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Documents verified"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Notes (optional)</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 font-semibold text-white hover:shadow-lg disabled:opacity-60 transition"
                >
                  {loading ? 'Updating...' : 'Update Status'}
                </button>
              </form>

              <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Change Requests</p>
                {!changeRequestItems.length ? (
                  <p className="mt-2 text-sm text-indigo-900">No change requests submitted by this doctor.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {changeRequestItems.slice(0, 3).map((item) => (
                      <article key={item.id} className="rounded-lg border border-indigo-200 bg-white p-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {cleanedChangeRequestReason(item.reason) || 'Profile change requested'}
                        </p>
                        {item.notes && <p className="mt-1 text-xs text-slate-600">{item.notes}</p>}
                        <p className="mt-2 text-xs text-slate-500">Requested by {item.changedBy}</p>
                        {!isResolvedChangeRequest(item) && !isChangeRequestDecisionEntry(item) && (
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleChangeRequestDecision(item.id, 'APPROVE')}
                              disabled={loading}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                              Approve And Apply
                            </button>
                            <button
                              type="button"
                              onClick={() => handleChangeRequestDecision(item.id, 'REJECT')}
                              disabled={loading}
                              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {isResolvedChangeRequest(item) && (
                          <p className="mt-3 text-xs font-semibold text-slate-500">This request is already resolved.</p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Verification Timeline */}
        {selectedDoctor && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">Verification History</h2>
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                {([
                  { key: 'ALL', label: 'All' },
                  { key: 'CHANGE_REQUESTS', label: 'Change Requests' },
                  { key: 'STATUS_UPDATES', label: 'Status Updates' },
                ] as const).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setHistoryView(item.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      historyView === item.key
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <VerificationTimeline items={visibleHistory} />
          </div>
        )}
      </div>
    </div>
  );
}
