import React, { useState } from 'react';
import { createPrescription, signPrescription } from '../../services/prescriptionApi';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, CheckCircle, FileSignature, Stethoscope } from 'lucide-react';

const emptyItem = {
  medicineName: '',
  medicineCode: '',
  strength: '',
  form: '',
  doseAmount: '',
  doseUnit: '',
  frequencyText: '',
  route: '',
  durationDays: 1,
  quantity: 1,
  substitutionAllowed: false,
};

export default function PrescriptionForm({ patientId, appointmentId, onCreated, onCancel }: { patientId: number, appointmentId: number, onCreated?: (prescription: any) => void, onCancel?: () => void }) {
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleItemChange = (idx: number, field: string, value: any) => {
    setItems(items => items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const addItem = () => setItems([...items, { ...emptyItem }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const validItems = items.filter(item => item.medicineName.trim() !== '');
    if (validItems.length === 0) {
        setError("Please add at least one valid medication.");
        setLoading(false);
        return;
    }
    
    try {
      const data = { patientId, appointmentId, diagnosis, notes, items: validItems };
      const createdPrescription = await createPrescription(data);
      let signedPrescription = createdPrescription;
      if (createdPrescription?.id) {
        try {
          signedPrescription = await signPrescription(createdPrescription.id);
        } catch (signErr: any) {
          const fieldErrors = signErr?.response?.data?.fieldErrors;
          const firstFieldError = fieldErrors ? Object.values(fieldErrors)[0] : null;
          setError(
            firstFieldError ||
            signErr?.response?.data?.message ||
            signErr?.message ||
            'Prescription was created, but signing failed.',
          );
          return;
        }
      }
      if (onCreated) onCreated(signedPrescription);
    } catch (err: any) {
      const fieldErrors = err?.response?.data?.fieldErrors;
      const firstFieldError = fieldErrors ? Object.values(fieldErrors)[0] : null;
      setError(firstFieldError || err?.response?.data?.message || err?.message || 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl border border-blue-100"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-8 text-white flex justify-between items-center">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <Stethoscope className="w-8 h-8 text-blue-200" />
             <h2 className="text-3xl font-extrabold tracking-tight">Digital Prescription</h2>
           </div>
           <p className="text-blue-100 font-medium ml-10">Advanced Clinical Order Pad</p>
        </div>
        <div className="text-6xl font-serif text-blue-200 opacity-30 select-none">Rx</div>
      </div>

      <form onSubmit={handleSubmit} className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Diagnosis</label>
                <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm" 
                    placeholder="Enter primary diagnosis..."
                    value={diagnosis} 
                    onChange={e => setDiagnosis(e.target.value)} 
                    required 
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Clinical Notes</label>
                <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm" 
                    placeholder="Additional instructions or notes..."
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                />
            </div>
        </div>

        <div>
            <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   Medications prescribed
                </h3>
            </div>
            
            <div className="space-y-4">
                <AnimatePresence>
                    {items.map((item, idx) => (
                    <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        className="bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl border border-slate-200 p-4 relative group shadow-sm"
                    >
                        <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-12 md:col-span-4">
                                {idx === 0 && <label className="text-xs font-semibold text-slate-500 mb-1 block">Medicine Name</label>}
                                <input placeholder="e.g. Amoxicillin" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={item.medicineName} onChange={e => handleItemChange(idx, 'medicineName', e.target.value)} required />
                            </div>
                            <div className="col-span-6 md:col-span-2">
                                {idx === 0 && <label className="text-xs font-semibold text-slate-500 mb-1 block">Strength</label>}
                                <input placeholder="500mg" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={item.strength} onChange={e => handleItemChange(idx, 'strength', e.target.value)} />
                            </div>
                            <div className="col-span-6 md:col-span-2">
                                {idx === 0 && <label className="text-xs font-semibold text-slate-500 mb-1 block">Frequency</label>}
                                <input placeholder="TDS" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={item.frequencyText} onChange={e => handleItemChange(idx, 'frequencyText', e.target.value)} />
                            </div>
                            <div className="col-span-6 md:col-span-2">
                                {idx === 0 && <label className="text-xs font-semibold text-slate-500 mb-1 block">Duration</label>}
                                <input placeholder="Days" type="number" min="1" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={item.durationDays} onChange={e => handleItemChange(idx, 'durationDays', Number(e.target.value))} />
                            </div>
                            <div className="col-span-6 md:col-span-2">
                                {idx === 0 && <label className="text-xs font-semibold text-slate-500 mb-1 block">Quantity</label>}
                                <input placeholder="Qty" type="number" min="1" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))} />
                            </div>
                            
                            <div className="col-span-12 flex gap-3 mt-1">
                                <div className="w-1/3">
                                    <input placeholder="Route (e.g. Oral)" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={item.route} onChange={e => handleItemChange(idx, 'route', e.target.value)} />
                                </div>
                                <div className="w-1/3">
                                    <input placeholder="Form (e.g. Tablet)" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={item.form} onChange={e => handleItemChange(idx, 'form', e.target.value)} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id={`subst-${idx}`} className="rounded text-blue-600 w-4 h-4" checked={item.substitutionAllowed} onChange={e => handleItemChange(idx, 'substitutionAllowed', e.target.checked)} />
                                    <label htmlFor={`subst-${idx}`} className="text-sm font-medium text-slate-600 cursor-pointer">Allow Substitution</label>
                                </div>
                            </div>
                        </div>

                        {items.length > 1 && (
                            <button 
                                type="button" 
                                onClick={() => removeItem(idx)} 
                                className="absolute -top-3 -right-3 bg-red-100 hover:bg-red-500 hover:text-white text-red-600 rounded-full p-2 transition-colors shadow-sm"
                                title="Remove medication"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <button 
                type="button" 
                onClick={addItem} 
                className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold px-4 py-2 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
            >
                <Plus className="w-5 h-5" /> Add Another Medication
            </button>
        </div>

        {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> {error}
            </motion.div>
        )}

        <div className="mt-8 flex justify-end gap-4 border-t border-slate-100 pt-6">
            {onCancel && (
                <button 
                    type="button" 
                    onClick={onCancel}
                    className="px-6 py-3 font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                    Cancel
                </button>
            )}
            <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-70" 
                disabled={loading}
            >
                {loading ? (
                    <span className="flex items-center gap-2"><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Issuing and Signing...</span>
                ) : (
                    <><FileSignature className="w-5 h-5" /> Issue Prescription</>
                )}
            </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
