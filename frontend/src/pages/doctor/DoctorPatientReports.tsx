import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Download, FileText, FolderOpen, Loader2, Users } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-3"
        >
          <h1 className="text-4xl font-bold text-slate-900">Patient Reports</h1>
          <p className="text-slate-600">
            Reports are available only for patients with confirmed or completed appointments under your care.
          </p>
          <div className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
            <Users className="h-4 w-4 text-blue-600" />
            {groups.length} patients · {totalReports} reports
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-lg">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />
            <p className="text-slate-600">Loading completed appointment patients and reports...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-lg">
            <FolderOpen className="mx-auto mb-3 h-10 w-10 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">No Patient Reports Yet</h2>
            <p className="mt-2 text-slate-600">
              Confirmed appointments are required before patient reports appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.patientId} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {group.profile?.firstName || group.profile?.lastName
                        ? `${group.profile?.firstName || ''} ${group.profile?.lastName || ''}`.trim()
                        : `Patient #${group.patientId}`}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {group.profile?.email || `Patient ID: ${group.patientId}`}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                    {group.reports.length} report{group.reports.length === 1 ? '' : 's'}
                  </span>
                </div>

                {group.error ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {group.error}
                  </p>
                ) : group.reports.length === 0 ? (
                  <p className="text-sm text-slate-500">No uploaded reports found for this patient.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.reports.map((report) => {
                      const key = `${group.patientId}-${report.id}`;
                      const isDownloading = downloadingKey === key;

                      return (
                        <article key={report.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-3 flex items-center gap-2 text-slate-700">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <p className="line-clamp-1 text-sm font-semibold">{report.title}</p>
                          </div>
                          <p className="mb-2 line-clamp-1 text-xs text-slate-600" title={report.originalFileName}>
                            {report.originalFileName}
                          </p>
                          <p className="mb-3 text-xs text-slate-500">
                            {report.reportType.replace('_', ' ')} · {formatFileSize(report.fileSize)}
                          </p>
                          <p className="mb-4 text-xs text-slate-500">
                            Uploaded {new Date(report.uploadedAt).toLocaleDateString()}
                          </p>
                          <button
                            type="button"
                            onClick={() => void handleDownload(group.patientId, report)}
                            disabled={isDownloading}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-70"
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
