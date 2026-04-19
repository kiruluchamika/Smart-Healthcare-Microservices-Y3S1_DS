import React, { useEffect, useState } from 'react';
import { getPrescriptionsByPatient } from '../../services/prescriptionApi';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Calendar, Activity, Pill, CheckCircle, Clock } from 'lucide-react';
import PrescriptionDetail from './PrescriptionDetail';
import { getDoctorById } from '../../services/doctor/doctorApi';

function formatDoctorName(doctor: any) {
  const fullName = `${doctor?.firstName || ''} ${doctor?.lastName || ''}`.trim();
  return fullName ? `Dr. ${fullName}` : null;
}

export default function PrescriptionList({ patientId }: { patientId: number }) {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [doctorNameMap, setDoctorNameMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    getPrescriptionsByPatient(patientId)
      .then(res => setPrescriptions(res))
      .catch(() => setError('Failed to load prescriptions'))
      .finally(() => setLoading(false));
  }, [patientId]);

  useEffect(() => {
    const doctorIds = [...new Set(prescriptions.map((rx) => rx.doctorId).filter(Boolean))].filter(
      (doctorId) => !doctorNameMap[doctorId],
    );

    if (!doctorIds.length) {
      return;
    }

    let isActive = true;

    const loadDoctors = async () => {
      const entries = await Promise.all(
        doctorIds.map(async (doctorId) => {
          try {
            const doctor = await getDoctorById(doctorId);
            return [doctorId, formatDoctorName(doctor) || `Doctor #${doctorId}`] as const;
          } catch {
            return [doctorId, `Doctor #${doctorId}`] as const;
          }
        }),
      );

      if (!isActive) {
        return;
      }

      setDoctorNameMap((current) => {
        const next = { ...current };
        entries.forEach(([doctorId, doctorName]) => {
          next[doctorId] = doctorName;
        });
        return next;
      });
    };

    void loadDoctors();

    return () => {
      isActive = false;
    };
  }, [prescriptions, doctorNameMap]);

  if (loading) return (
      <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
  );
  
  if (error) return (
      <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 text-center shadow-sm">
          {error}
      </div>
  );
  
  if (!prescriptions.length) return (
      <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center shadow-lg text-slate-500">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Prescriptions Yet</h3>
          <p>Any digital prescriptions issued by your doctors will securely appear here.</p>
      </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Prescriptions</h2>
          <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-1.5 rounded-full">{prescriptions.length} Records</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prescriptions.map((rx, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={rx.id} 
            className="group relative bg-white border border-slate-200 hover:border-blue-300 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <FileText className="w-24 h-24 text-blue-600" />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Rx Number</p>
                        <p className="font-mono text-sm font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block">{rx.rxNumber}</p>
                    </div>
                    {rx.status === 'SIGNED' ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> SIGNED</span>
                    ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full"><Clock className="w-3 h-3" /> DRAFT</span>
                    )}
                </div>

                <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1"><Activity className="w-3 h-3" /> Diagnosis</p>
                    <p className="text-lg font-bold text-slate-800 leading-snug">{rx.diagnosis}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Prescribed by {doctorNameMap[rx.doctorId] || `Doctor #${rx.doctorId}`}
                    </p>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span><strong className="text-slate-800">Issued:</strong> {new Date(rx.issuedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                        <Pill className="w-4 h-4 text-indigo-500 mt-1 shrink-0" />
                        <div>
                            <strong className="text-slate-800 block mb-1">Medications ({rx.items?.length || 0}):</strong>
                            <p className="line-clamp-2 text-slate-500 leading-tight">
                                {rx.items?.map((item: any) => item.medicineName).join(', ')}
                            </p>
                        </div>
                    </div>
                </div>

                <button onClick={() => setSelectedPrescriptionId(rx.id)} className="w-full py-2.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl font-semibold transition-colors mt-2 text-sm flex justify-center items-center gap-2">
                    <FileText className="w-4 h-4" /> View Details & Print
                </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedPrescriptionId && (
          <div className="fixed inset-0 z-[60] overflow-y-auto flex p-4 sm:p-8 justify-center">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm no-print"
                onClick={() => setSelectedPrescriptionId(null)}
              />
              <div className="relative z-10 w-full h-max mt-4 sm:mt-10 pb-20 flex justify-center">
                 <PrescriptionDetail 
                    prescriptionId={selectedPrescriptionId} 
                    onClose={() => setSelectedPrescriptionId(null)} 
                 />
              </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
