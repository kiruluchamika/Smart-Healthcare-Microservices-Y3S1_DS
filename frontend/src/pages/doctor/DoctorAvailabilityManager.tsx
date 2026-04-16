import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarRange, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { AvailabilitySlotEditor } from '../../components/doctor/AvailabilitySlotEditor';
import { DoctorTopNav } from '../../components/doctor/DoctorTopNav';
import {
  createAvailability,
  deleteAvailability,
  getAvailability,
  updateAvailability,
} from '../../services/doctor/doctorApi';
import type { DoctorAvailability, DoctorAvailabilityPayload } from '../../types/doctor';
import { formatDate, formatDayOfWeek, formatTime } from '../../utils/doctor/doctorFormatters';

function parseLocalDate(value?: string) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatPreviewDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getMatchingDatesPreview(dayOfWeek: string, effectiveFrom?: string, effectiveTo?: string) {
  const start = parseLocalDate(effectiveFrom);
  const end = parseLocalDate(effectiveTo);
  const dayMap: Record<string, number> = {
    MONDAY: 0,
    TUESDAY: 1,
    WEDNESDAY: 2,
    THURSDAY: 3,
    FRIDAY: 4,
    SATURDAY: 5,
    SUNDAY: 6,
  };

  const targetDay = dayMap[dayOfWeek];
  if (targetDay === undefined || !start || !end || start > end) {
    return [];
  }

  const matches: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end && matches.length < 3) {
    const currentDay = (cursor.getDay() + 6) % 7;
    if (currentDay === targetDay) {
      matches.push(formatPreviewDate(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return matches;
}

export default function DoctorAvailabilityManager() {
  const params = useParams();
  const doctorId = Number(params.id || 0);

  const [slots, setSlots] = useState<DoctorAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);

  const loadSlots = useCallback(async () => {
    if (!doctorId) {
      setError('Invalid doctor id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await getAvailability(doctorId);
      setSlots(result);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load availability slots.');
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const handleCreate = async (payload: DoctorAvailabilityPayload) => {
    setSaving(true);
    setError('');

    try {
      await createAvailability(doctorId, payload);
      await loadSlots();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to create availability slot.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (availabilityId: number, payload: DoctorAvailabilityPayload) => {
    setSaving(true);
    setError('');

    try {
      await updateAvailability(doctorId, availabilityId, payload);
      setEditingSlotId(null);
      await loadSlots();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to update availability slot.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (availabilityId: number) => {
    setSaving(true);
    setError('');

    try {
      await deleteAvailability(doctorId, availabilityId);
      await loadSlots();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to delete availability slot.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 lg:px-8 text-slate-900 font-sans selection:bg-teal-500/30">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-200/40 rounded-full blur-[120px] pointer-events-none opacity-60" />
      <div className="absolute bottom-0 left-[-10%] w-[600px] h-[600px] bg-blue-200/30 rounded-full blur-[100px] pointer-events-none opacity-60" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <DoctorTopNav doctorId={doctorId} />
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-teal-100 backdrop-blur-sm shadow-sm mb-4">
             <CalendarRange className="h-4 w-4 text-teal-600" />
             <span className="text-xs font-bold uppercase tracking-widest text-teal-700">Schedule Management</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 mb-2">Availability Settings</h1>
          <p className="text-base text-slate-500 max-w-2xl mx-auto">Configure your standard working hours and recurring slots to allow patients to book appointments securely.</p>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 rounded-[2rem] border border-rose-200 bg-rose-50/80 backdrop-blur-sm p-6 shadow-sm">
             <p className="text-sm font-semibold text-rose-700">{error}</p>
          </motion.div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] items-start">
          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-[2.5rem] border border-white bg-white/70 backdrop-blur-xl p-8 shadow-xl shadow-teal-900/[0.04] sticky top-28"
          >
            <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-teal-700 border-b border-slate-200/60 pb-4">Create New Slot</h2>
            <div className="bg-white/50 rounded-2xl p-6 border border-white shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
               <AvailabilitySlotEditor onSubmit={handleCreate} isSubmitting={saving} submitLabel="Publish Slot" />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-[2.5rem] border border-white bg-white/70 backdrop-blur-xl p-8 shadow-xl shadow-teal-900/[0.04]"
          >
            <div className="mb-6 flex items-center justify-between border-b border-slate-200/60 pb-4">
              <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900">
                <span className="p-2 bg-teal-50 text-teal-600 rounded-xl"><CalendarRange className="h-5 w-5" /></span>
                Active Slots
              </h2>
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{slots.length} Total</span>
            </div>

            {loading && <div className="h-48 animate-pulse rounded-[2rem] border border-white bg-white/60 backdrop-blur-md shadow-sm" />}

            {!loading && slots.length === 0 && (
              <div className="rounded-[2xl] border border-dashed border-slate-300 bg-white/40 p-12 text-center shadow-inner">
                <CalendarRange className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-sm font-semibold text-slate-600 mb-1">Schedule is empty.</p>
                <p className="text-xs text-slate-500">Create your first availability slot from the panel on the left.</p>
              </div>
            )}

            {!loading && slots.length > 0 && (
              <div className="space-y-4">
                {slots.map((slot) => (
                  <article key={slot.id} className="relative overflow-hidden rounded-[2rem] border border-white bg-white/60 p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:bg-white/80 group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-teal-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {editingSlotId === slot.id ? (
                      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <AvailabilitySlotEditor
                          initialValue={{
                            dayOfWeek: slot.dayOfWeek,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            slotDuration: (slot.slotDuration || 30) as DoctorAvailabilityPayload['slotDuration'],
                            isAvailable: slot.isAvailable,
                            effectiveFrom: slot.effectiveFrom,
                            effectiveTo: slot.effectiveTo,
                          }}
                          onSubmit={(payload) => handleUpdate(slot.id, payload)}
                          isSubmitting={saving}
                          submitLabel="Confirm Updates"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                              {slot.effectiveFrom && slot.effectiveTo
                                ? 'Every day'
                                : `Every ${formatDayOfWeek(slot.dayOfWeek)}`}{' '}
                              <span className="text-slate-400 font-normal mx-1">from</span> {formatTime(slot.startTime)} <span className="text-slate-400 font-normal mx-1">to</span> {formatTime(slot.endTime)}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              {formatDate(slot.effectiveFrom)} &mdash; {formatDate(slot.effectiveTo)}
                            </p>
                            {!slot.effectiveFrom || !slot.effectiveTo ? (
                              getMatchingDatesPreview(slot.dayOfWeek, slot.effectiveFrom, slot.effectiveTo).length > 0 && (
                                <p className="mt-2 text-sm text-slate-600">
                                  Booking dates in this range:
                                  {' '}
                                  <span className="font-medium">
                                    {getMatchingDatesPreview(slot.dayOfWeek, slot.effectiveFrom, slot.effectiveTo).join(', ')}
                                  </span>
                                </p>
                              )
                            ) : (
                              <p className="mt-2 text-sm text-slate-600">
                                Booking dates in this range:
                                {' '}
                                <span className="font-medium">
                                  {formatDate(slot.effectiveFrom)} to {formatDate(slot.effectiveTo)}
                                </span>
                              </p>
                            )}
                            <p className="mt-2 text-sm font-medium text-slate-600">
                              Slot duration: {slot.slotDuration || 30} minutes
                            </p>
                            <p className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border shadow-sm ${slot.isAvailable ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                              <span className={`w-2 h-2 rounded-full ${slot.isAvailable ? 'bg-teal-500 animate-pulse' : 'bg-slate-400'}`}></span>
                              {slot.isAvailable ? 'Status: Active Booking' : 'Status: Unavailable'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 self-start sm:self-center">
                            <button
                              type="button"
                              onClick={() => setEditingSlotId(slot.id)}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(slot.id)}
                              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 shadow-sm transition-all hover:bg-rose-100 hover:shadow-md"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </article>
                ))}
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
}
