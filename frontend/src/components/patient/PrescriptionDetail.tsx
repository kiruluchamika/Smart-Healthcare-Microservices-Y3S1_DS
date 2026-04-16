import React, { useEffect, useState } from 'react';
import { getPrescription } from '../../services/prescriptionApi';
import { Download, X, Stethoscope, BadgeCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PrescriptionDetail({ prescriptionId, onClose }: { prescriptionId: number, onClose: () => void }) {
  const [rx, setRx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getPrescription(prescriptionId)
      .then(res => setRx(res))
      .catch(() => setError('Failed to load prescription'))
      .finally(() => setLoading(false));
  }, [prescriptionId]);

  const handlePrint = () => {
      window.print();
  };

  if (loading) return (
      <div className="flex justify-center items-center py-20 bg-white min-h-[500px] rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
  );
  if (error) return <div className="text-red-500 p-10 bg-white rounded-2xl">{error}</div>;
  if (!rx) return <div className="p-10 bg-white rounded-2xl">Prescription not found.</div>;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-prescription, #printable-prescription * {
            visibility: visible;
          }
          #printable-prescription {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            border: none;
            box-shadow: none;
          }
          .no-print { display: none !important; }
        }
      `}</style>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-4xl border border-slate-200 relative"
      >
          {/* Controls - These hide during print */}
          <div className="bg-slate-100 p-4 flex justify-between items-center border-b border-slate-200 no-print">
              <h3 className="font-bold text-slate-700">Digital Prescription Viewer</h3>
              <div className="flex gap-3">
                  <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm">
                      <Download className="w-4 h-4" /> Save as PDF / Print
                  </button>
                  <button onClick={onClose} className="bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 p-2 rounded-lg transition-colors">
                      <X className="w-5 h-5" />
                  </button>
              </div>
          </div>

          <div id="printable-prescription" className="p-10 bg-white">
              {/* Rx Header */}
              <div className="flex justify-between items-start border-b-2 border-blue-900 pb-6 mb-8">
                  <div className="flex items-center gap-3">
                      <Stethoscope className="w-12 h-12 text-blue-900" />
                      <div>
                          <h1 className="text-3xl font-extrabold text-slate-900">HealthTech Digital Rx</h1>
                          <p className="text-sm font-semibold text-slate-500 tracking-wider uppercase mt-1">Official Prescription Document</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Rx Number</div>
                      <div className="font-mono text-lg font-bold text-slate-800">{rx.rxNumber}</div>
                      <div className="mt-2 text-xs text-slate-500">Issued: {new Date(rx.issuedAt).toLocaleDateString()}</div>
                  </div>
              </div>

              {/* Patient / Doctor Meta */}
              <div className="grid grid-cols-2 gap-8 mb-10 text-sm">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Patient Details</h4>
                      <p className="font-semibold text-slate-800 text-base">Patient ID: #{rx.patientId}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Prescribing Physician</h4>
                      <p className="font-semibold text-slate-800 text-base">Doctor ID: #{rx.doctorId}</p>
                      <p className="text-slate-500 mt-1">Signed by: {rx.signedBy || 'Pending Signature'}</p>
                  </div>
              </div>

              {/* Diagnosis */}
              <div className="mb-10">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100 pb-2 mb-3">Primary Diagnosis / Indication</h4>
                  <p className="text-lg font-semibold text-slate-800">{rx.diagnosis}</p>
                  {rx.notes && (
                      <p className="text-sm text-slate-600 mt-2 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg">
                          <strong>Notes: </strong> {rx.notes}
                      </p>
                  )}
              </div>

              {/* Medications */}
              <div className="mb-12 relative">
                  <div className="absolute top-0 right-0 text-9xl font-serif text-slate-100 select-none -z-10 mt-[-40px]">Rx</div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100 pb-2 mb-4">Medications Prescribed</h4>
                  
                  <div className="space-y-6">
                      {rx.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex gap-4 items-start">
                              <div className="text-slate-300 font-mono font-bold pt-1 text-lg">{(idx + 1).toString().padStart(2, '0')}</div>
                              <div className="flex-1">
                                  <div className="flex justify-between items-end mb-1">
                                      <h5 className="text-xl font-bold text-slate-900">{item.medicineName}</h5>
                                      <span className="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-md text-sm">Qty: {item.quantity}</span>
                                  </div>
                                  <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                      <p className="mb-1"><strong>Strength & Form:</strong> {item.strength || 'N/A'}, {item.form || 'N/A'}</p>
                                      <p className="mb-1"><strong>Dosage:</strong> Take {item.doseAmount} {item.doseUnit} via {item.route || 'indicated route'}, {item.frequencyText || 'as directed'}.</p>
                                      <p><strong>Duration:</strong> {item.durationDays} days.</p>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Signature Footer */}
              <div className="mt-16 pt-8 border-t border-slate-200 flex justify-between items-end">
                  <div className="text-xs text-slate-400 max-w-xs">
                      This is a digitally generated prescription. Substitution permitted unless otherwise indicated.
                  </div>
                  
                  <div className="text-center min-w-[200px]">
                      {rx.status === 'SIGNED' ? (
                          <div className="inline-block border-b-2 border-slate-800 pb-2 mb-2 px-10">
                              <div className="text-blue-700 font-serif italic text-2xl mb-1">{rx.signedBy}</div>
                              <div className="flex justify-center items-center gap-1 text-xs font-bold text-emerald-600">
                                  <BadgeCheck className="w-4 h-4" /> Digitally Signed
                              </div>
                          </div>
                      ) : (
                          <div className="inline-block border-b-2 border-slate-300 pb-2 mb-2 px-10 text-slate-400 italic">
                             Draft / Unsigned
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </motion.div>
    </>
  );
}
