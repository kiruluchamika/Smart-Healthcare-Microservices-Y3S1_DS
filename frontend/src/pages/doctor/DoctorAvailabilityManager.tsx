import { useCallback, useEffect, useState } from 'react';
import { CalendarRange, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { AvailabilitySlotEditor } from '../../components/doctor/AvailabilitySlotEditor';
import {
  createAvailability,
  deleteAvailability,
  getAvailability,
  updateAvailability,
} from '../../services/doctor/doctorApi';
import type { DoctorAvailability, DoctorAvailabilityPayload } from '../../types/doctor';
import { formatDate, formatDayOfWeek, formatTime } from '../../utils/doctor/doctorFormatters';

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
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-emerald-50 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">Availability Manager</h1>
          <p className="mt-2 text-sm text-slate-600">Create, update, and remove doctor availability slots.</p>
        </div>

        {error && <p className="mb-4 rounded-xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Add Slot</h2>
          <AvailabilitySlotEditor onSubmit={handleCreate} isSubmitting={saving} submitLabel="Create slot" />
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
            <CalendarRange className="h-5 w-5 text-teal-600" />
            Existing Slots
          </h2>

          {loading && <div className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white" />}

          {!loading && slots.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
              No availability slots yet.
            </div>
          )}

          {!loading && slots.length > 0 && (
            <div className="space-y-3">
              {slots.map((slot) => (
                <article key={slot.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  {editingSlotId === slot.id ? (
                    <AvailabilitySlotEditor
                      initialValue={{
                        dayOfWeek: slot.dayOfWeek,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        isAvailable: slot.isAvailable,
                        effectiveFrom: slot.effectiveFrom,
                        effectiveTo: slot.effectiveTo,
                      }}
                      onSubmit={(payload) => handleUpdate(slot.id, payload)}
                      isSubmitting={saving}
                      submitLabel="Save changes"
                    />
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {formatDayOfWeek(slot.dayOfWeek)} {formatTime(slot.startTime)} to {formatTime(slot.endTime)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Effective {formatDate(slot.effectiveFrom)} to {formatDate(slot.effectiveTo)}
                          </p>
                          <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${slot.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {slot.isAvailable ? 'Available' : 'Unavailable'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingSlotId(slot.id)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(slot.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
