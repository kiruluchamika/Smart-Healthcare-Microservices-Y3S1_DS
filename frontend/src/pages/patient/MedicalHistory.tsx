import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Building2, CalendarDays, PencilLine, Plus, ShieldCheck, Stethoscope, Trash2 } from 'lucide-react';
import { patientApi } from '../../services/patientApi';
import { EventType, MedicalHistory, MedicalHistoryRequest } from '../../types/patient';

const emptyFormState = (): MedicalHistoryRequest => ({
  eventType: 'DIAGNOSIS',
  title: '',
  description: '',
  eventDate: new Date().toISOString().split('T')[0],
  doctorName: '',
  facilityName: '',
  notes: ''
});

const eventTypeStyles: Record<EventType, string> = {
  DIAGNOSIS: 'bg-red-50 text-red-700 border-red-200',
  SURGERY: 'bg-violet-50 text-violet-700 border-violet-200',
  HOSPITALIZATION: 'bg-blue-50 text-blue-700 border-blue-200',
  ALLERGY: 'bg-amber-50 text-amber-700 border-amber-200',
  VACCINATION: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEDICATION: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  LAB_RESULT: 'bg-pink-50 text-pink-700 border-pink-200',
  OTHER: 'bg-slate-50 text-slate-700 border-slate-200'
};

const eventTypeBadge = (type: EventType) => type.replace('_', ' ');

const MedicalHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<MedicalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<MedicalHistoryRequest>(emptyFormState());

  const totalEvents = history.length;
  const newestEventDate = useMemo(() => {
    if (!history.length) return 'No events yet';
    return new Date(history[0].eventDate).toLocaleDateString();
  }, [history]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await patientApi.getHistory();
      if (res.success) {
        setHistory(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load medical history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleOpenForm = (existingItem?: MedicalHistory) => {
    if (existingItem) {
      setEditingId(existingItem.id);
      setFormData({
        eventType: existingItem.eventType,
        title: existingItem.title,
        description: existingItem.description || '',
        eventDate: existingItem.eventDate,
        doctorName: existingItem.doctorName || '',
        facilityName: existingItem.facilityName || '',
        notes: existingItem.notes || ''
      });
    } else {
      setEditingId(null);
      setFormData(emptyFormState());
    }
    setError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      if (editingId !== null) {
        await patientApi.updateHistory(editingId, formData);
      } else {
        await patientApi.addHistory(formData);
      }

      await fetchHistory();
      setShowModal(false);
      setFormData(emptyFormState());
      setEditingId(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save history entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      setError(null);
      await patientApi.deleteHistory(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete history entry.');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#ccfbf1,transparent_40%),linear-gradient(180deg,#f8fafc_0%,#ffffff_80%)] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg overflow-hidden"
        >
          <div className="bg-gradient-to-r from-teal-600 via-slate-700 to-slate-900 text-white px-6 py-7 sm:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Medical History Atlas</h1>
                <p className="text-teal-100 mt-1">A clean timeline of your diagnoses, procedures, and milestones.</p>
              </div>
              <button
                onClick={() => handleOpenForm()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-teal-700 px-5 py-3 font-bold hover:bg-teal-50 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Event
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-6 py-5 sm:px-8 border-b border-slate-100 bg-white">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Total events</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalEvents}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Last activity</p>
              <p className="text-lg font-bold text-slate-900 mt-1">{newestEventDate}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="text-xs uppercase tracking-wider text-emerald-700 font-semibold">Status</p>
                <p className="text-sm font-bold text-emerald-700">Chronology synced</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-100 p-5 animate-pulse">
                    <div className="h-4 w-36 bg-slate-200 rounded mb-3" />
                    <div className="h-4 w-4/5 bg-slate-200 rounded mb-2" />
                    <div className="h-4 w-2/3 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
                <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-slate-900">Your timeline is empty</h3>
                <p className="mt-2 text-slate-500 max-w-md mx-auto">
                  Start documenting key events so your doctors get a clearer picture of your medical journey.
                </p>
                <button
                  onClick={() => handleOpenForm()}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 text-white px-5 py-3 font-bold hover:from-teal-700 hover:to-cyan-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add First Event
                </button>
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8">
                <div className="absolute left-2 sm:left-3 top-1 bottom-1 w-px bg-gradient-to-b from-teal-200 via-slate-200 to-cyan-200" />

                <div className="space-y-5">
                  {history.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.04 }}
                      className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="absolute -left-[1.55rem] sm:-left-[1.8rem] top-7 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-teal-100" />

                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${eventTypeStyles[item.eventType]}`}>
                              {eventTypeBadge(item.eventType)}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">{new Date(item.eventDate).toLocaleDateString()}</span>
                          </div>

                          <h3 className="text-lg font-black text-slate-900">{item.title}</h3>

                          {item.description && (
                            <p className="mt-2 text-slate-600 leading-relaxed">{item.description}</p>
                          )}

                          {(item.doctorName || item.facilityName) && (
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                              {item.doctorName && (
                                <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                                  <Stethoscope className="w-4 h-4" />
                                  {item.doctorName}
                                </span>
                              )}
                              {item.facilityName && (
                                <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                                  <Building2 className="w-4 h-4" />
                                  {item.facilityName}
                                </span>
                              )}
                            </div>
                          )}

                          {item.notes && (
                            <div className="mt-3 text-sm text-slate-600 border border-slate-200 rounded-xl bg-slate-50 p-3">
                              <span className="font-semibold text-slate-700">Clinical note:</span> {item.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleOpenForm(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 border border-teal-100"
                          >
                            <PencilLine className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 border border-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="px-6 py-5 sm:px-8 border-b border-slate-100 sticky top-0 bg-white z-10">
                <h3 className="text-xl font-black text-slate-900">{editingId !== null ? 'Edit Health Event' : 'Add Health Event'}</h3>
                <p className="text-sm text-slate-500 mt-1">Capture what happened, when it happened, and where it happened.</p>
              </div>

              <form onSubmit={handleSave} className="px-6 py-6 sm:px-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Event Type</label>
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                      value={formData.eventType}
                      onChange={(e) => setFormData({ ...formData, eventType: e.target.value as EventType })}
                    >
                      {Object.keys(eventTypeStyles).map((key) => (
                        <option key={key} value={key}>{key.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Date *</label>
                    <input
                      type="date"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. Wisdom Tooth Extraction"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                    <textarea
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Doctor Name</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                      value={formData.doctorName}
                      onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Facility / Hospital</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                      value={formData.facilityName}
                      onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                    <textarea
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 text-white text-sm font-bold hover:from-teal-700 hover:to-cyan-600 disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : editingId !== null ? 'Save Changes' : 'Create Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MedicalHistoryPage;
