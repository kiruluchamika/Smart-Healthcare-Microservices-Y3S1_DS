import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CalendarDays, Download, FileText, FolderOpen, Loader2, ShieldCheck, Users } from 'lucide-react';
import { getMyDoctorAppointments } from '../../services/appointmentsApi';
import { patientApi } from '../../services/patientApi';
import type { MedicalReport, PatientProfile } from '../../types/patient';

type PatientReportGroup = {
  patientId: number;
  profile: PatientProfile | null;
  reports: MedicalReport[];
  error?: string;
};

function formatFileSize(bytes: number) {
  if (bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const normalized = bytes / Math.pow(1024, unitIndex);
  return `${normalized.toFixed(normalized < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

function getDisplayName(profile: PatientProfile | null, patientId: number) {
  if (!profile) {
    return `Patient #${patientId}`;
  }

  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
  return fullName || `Patient #${patientId}`;
}

export default function DoctorPatientReports() {
  const [groups, setGroups] = useState<PatientReportGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  useEffect(() => {
    const loadPatientReports = async () => {
      setIsLoading(true);
      setError('');

      try {
        const appointments = await getMyDoctorAppointments();
        const accessiblePatientIds = Array.from(
          new Set(
            appointments
              .filter(
                (appointment) =>
                  appointment.status === 'CONFIRMED' || appointment.status === 'COMPLETED',
              )
              .map((appointment) => appointment.patientId),
          ),
        );

        if (accessiblePatientIds.length === 0) {
          setGroups([]);
          return;
        }

        const reportGroups = await Promise.all(
          accessiblePatientIds.map(async (patientId) => {
            try {
              const [reportsResponse, profileResponse] = await Promise.all([
                patientApi.getReportsForDoctor(patientId),
                patientApi.getPatientProfileForDoctor(patientId),
              ]);

              return {
                patientId,
                profile: profileResponse.data,
                reports: reportsResponse.data,
              } satisfies PatientReportGroup;
            } catch (groupError) {
              return {
                patientId,
                profile: null,
                reports: [],
                error:
                  groupError instanceof Error
                    ? groupError.message
                    : 'Unable to load reports for this patient',
              } satisfies PatientReportGroup;
            }
          }),
        );

        setGroups(reportGroups.sort((left, right) => left.patientId - right.patientId));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load patient reports');
      } finally {
        setIsLoading(false);
      }
    };

    void loadPatientReports();
  }, []);

  const totalReports = useMemo(
    () => groups.reduce((sum, group) => sum + group.reports.length, 0),
    [groups],
  );

  const totalPatients = groups.length;

  const accessSummary = useMemo(() => {
    if (!totalPatients) {
      return 'No confirmed patient records yet';
    }

    return `${totalPatients} linked patient${totalPatients === 1 ? '' : 's'} under your care`;
  }, [totalPatients]);

  const handleDownload = async (patientId: number, report: MedicalReport) => {
    const key = `${patientId}-${report.id}`;
    setDownloadingKey(key);

    try {
      const response = await patientApi.downloadPatientReportBlobForDoctor(patientId, report.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.setAttribute('download', report.originalFileName);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download report file. Please retry.');
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#e8f1f4] px-4 pb-20 pt-28 text-slate-900 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(13,148,136,0.16),transparent_35%),radial-gradient(circle_at_82%_18%,rgba(8,145,178,0.12),transparent_34%),radial-gradient(circle_at_50%_88%,rgba(255,255,255,0.9),transparent_40%)]" />
      <div className="absolute inset-0 backdrop-blur-[1px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 grid gap-4 rounded-[1.8rem] border border-white/70 bg-white/65 p-5 shadow-[0_18px_60px_rgba(13,55,78,0.12)] backdrop-blur-xl lg:grid-cols-[1.5fr_1fr] lg:p-6"
        >
          <div className="space-y-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Doctor Records
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Patient Reports</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                View patient reports for appointments that are confirmed or completed under your care.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                <Users className="h-4 w-4 text-teal-600" />
                {totalPatients} patient{totalPatients === 1 ? '' : 's'}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                <FileText className="h-4 w-4 text-cyan-600" />
                {totalReports} report{totalReports === 1 ? '' : 's'}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                <CalendarDays className="h-4 w-4 text-slate-500" />
                {accessSummary}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[1.3rem] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Access Scope</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Confirmed and completed appointments only</p>
              <p className="mt-1 text-sm text-slate-600">This keeps the reports view aligned with the doctor-patient relationship.</p>
            </div>
            <div className="rounded-[1.3rem] border border-teal-100 bg-gradient-to-r from-teal-600 to-cyan-500 p-4 text-white shadow-lg shadow-teal-600/20">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-50/80">Quick Status</p>
              <p className="mt-2 text-sm font-semibold">Ready to review</p>
              <p className="mt-1 text-sm text-teal-50/90">Open a patient card to inspect the latest uploads and download files.</p>
            </div>
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-[1.6rem] border border-white/80 bg-white/75 p-12 text-center shadow-[0_18px_60px_rgba(13,55,78,0.12)] backdrop-blur-xl">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-teal-600" />
            <p className="text-slate-600">Loading confirmed patients and report files...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-12 text-center shadow-[0_18px_60px_rgba(13,55,78,0.12)]">
            <FolderOpen className="mx-auto mb-3 h-10 w-10 text-teal-600" />
            <h2 className="text-2xl font-bold text-slate-900">No Patient Reports Yet</h2>
            <p className="mt-2 text-slate-600">
              Reports will appear here once you have confirmed or completed appointments with patients.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.patientId} className="rounded-[1.5rem] border border-white/80 bg-white/80 p-5 shadow-[0_14px_40px_rgba(13,55,78,0.08)] backdrop-blur-xl sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-500 text-white shadow-lg shadow-teal-600/20">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 sm:text-xl">{getDisplayName(group.profile, group.patientId)}</h2>
                      <p className="text-xs text-slate-500">{group.profile?.email || `Patient ID: ${group.patientId}`}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
                    {group.reports.length} report{group.reports.length === 1 ? '' : 's'}
                  </span>
                </div>

                {group.error ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                    {group.error}
                  </p>
                ) : group.reports.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    No uploaded reports found for this patient.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {group.reports.map((report) => {
                      const key = `${group.patientId}-${report.id}`;
                      const isDownloading = downloadingKey === key;

                      return (
                        <article key={report.id} className="group rounded-[1.2rem] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                          <div className="mb-3 flex items-center gap-2 text-slate-700">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-100">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="line-clamp-1 text-sm font-bold text-slate-900">{report.title}</p>
                              <p className="text-[11px] uppercase tracking-wide text-slate-500">{report.reportType.replace('_', ' ')}</p>
                            </div>
                          </div>
                          <p className="mb-2 line-clamp-1 text-xs text-slate-600" title={report.originalFileName}>
                            {report.originalFileName}
                          </p>
                          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">{formatFileSize(report.fileSize)}</span>
                            <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                              Uploaded {new Date(report.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleDownload(group.patientId, report)}
                            disabled={isDownloading}
                            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-teal-700 disabled:opacity-70"
                          >
                            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            Download
                          </button>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
