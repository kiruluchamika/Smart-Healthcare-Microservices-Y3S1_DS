import { useMemo, useState } from 'react';
import { DOCTOR_DAYS } from '../../constants/doctor';
import type { DoctorAvailabilityPayload } from '../../types/doctor';
import { formatDaysOfWeek } from '../../utils/doctor/doctorFormatters';

interface AvailabilitySlotEditorProps {
  initialValue?: DoctorAvailabilityPayload;
  onSubmit: (payload: DoctorAvailabilityPayload) => Promise<void> | void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const defaultForm: DoctorAvailabilityPayload = {
  dayOfWeek: 'MONDAY',
  daysOfWeek: ['MONDAY'],
  startTime: '09:00:00',
  endTime: '10:00:00',
  slotDuration: 30,
  isAvailable: true,
};

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

function formatShortDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function normalizeDaysOfWeek(daysOfWeek?: string[], legacyDayOfWeek?: string) {
  const resolved = daysOfWeek && daysOfWeek.length > 0 ? daysOfWeek : legacyDayOfWeek ? [legacyDayOfWeek] : [];
  const normalized = DOCTOR_DAYS.filter((day) => resolved.includes(day));
  return normalized.length > 0 ? normalized : ['MONDAY'];
}

export function AvailabilitySlotEditor({
  initialValue,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Save slot',
}: AvailabilitySlotEditorProps) {
  const [form, setForm] = useState<DoctorAvailabilityPayload>(() => {
    const base = initialValue || defaultForm;
    const daysOfWeek = normalizeDaysOfWeek(base.daysOfWeek, base.dayOfWeek);

    return {
      ...base,
      dayOfWeek: daysOfWeek[0],
      daysOfWeek,
    };
  });
  const [error, setError] = useState('');

  const hasValidRange = useMemo(() => form.startTime < form.endTime, [form.endTime, form.startTime]);

  const hasValidDates = useMemo(() => {
    if (!form.effectiveFrom || !form.effectiveTo) {
      return true;
    }

    return form.effectiveFrom <= form.effectiveTo;
  }, [form.effectiveFrom, form.effectiveTo]);

  const recurrencePreview = useMemo(() => {
    const start = parseLocalDate(form.effectiveFrom);
    const end = parseLocalDate(form.effectiveTo);

    if (!start || !end || start > end || form.daysOfWeek.length === 0) {
      return null;
    }

    const matchedDates: string[] = [];
    const cursor = new Date(start);

    while (cursor <= end && matchedDates.length < 4) {
      const currentDayIndex = (cursor.getDay() + 6) % 7;
      const currentDay = DOCTOR_DAYS[currentDayIndex];
      if (form.daysOfWeek.includes(currentDay)) {
        matchedDates.push(formatShortDate(cursor));
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return matchedDates;
  }, [form.daysOfWeek, form.effectiveFrom, form.effectiveTo]);

  const toggleDay = (day: string) => {
    setForm((prev) => {
      const nextDays = prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((value) => value !== day)
        : [...prev.daysOfWeek, day];

      const normalized = DOCTOR_DAYS.filter((value) => nextDays.includes(value));
      return {
        ...prev,
        dayOfWeek: normalized[0],
        daysOfWeek: normalized,
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (form.daysOfWeek.length === 0) {
      setError('Select at least one day.');
      return;
    }

    if (!hasValidRange) {
      setError('Start time must be before end time.');
      return;
    }

    if (!hasValidDates) {
      setError('Effective from date must be before effective to date.');
      return;
    }

    setError('');
    await onSubmit({
      ...form,
      dayOfWeek: form.daysOfWeek[0],
      daysOfWeek: [...form.daysOfWeek],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      {error && <p className="rounded-md bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="grid gap-3 md:grid-cols-2">
        <fieldset className="md:col-span-2">
          <legend className="mb-2 block text-xs font-semibold text-slate-500">Repeat on</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {DOCTOR_DAYS.map((day) => {
              const checked = form.daysOfWeek.includes(day);
              return (
                <label
                  key={day}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                    checked
                      ? 'border-teal-300 bg-teal-50 text-teal-900'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleDay(day)}
                    className="accent-teal-600"
                  />
                  {formatDaysOfWeek([day])}
                </label>
              );
            })}
          </div>
        </fieldset>

        <label className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.isAvailable}
            onChange={(e) => setForm((prev) => ({ ...prev, isAvailable: e.target.checked }))}
            className="accent-teal-600"
          />
          Available
        </label>

        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Selected days</span>
          <span className="font-medium">{form.daysOfWeek.length > 0 ? formatDaysOfWeek(form.daysOfWeek) : 'None selected'}</span>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Start time</span>
          <input
            type="time"
            value={form.startTime.slice(0, 5)}
            onChange={(e) => setForm((prev) => ({ ...prev, startTime: `${e.target.value}:00` }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-500">End time</span>
          <input
            type="time"
            value={form.endTime.slice(0, 5)}
            onChange={(e) => setForm((prev) => ({ ...prev, endTime: `${e.target.value}:00` }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Slot duration</span>
          <select
            value={form.slotDuration}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                slotDuration: Number(e.target.value) as DoctorAvailabilityPayload['slotDuration'],
              }))
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
          >
            {[15, 30, 45, 60].map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} minutes
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Effective from</span>
          <input
            type="date"
            value={form.effectiveFrom || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, effectiveFrom: e.target.value || undefined }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Effective to</span>
          <input
            type="date"
            value={form.effectiveTo || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, effectiveTo: e.target.value || undefined }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
          />
        </label>
      </div>

      <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-900">
        {form.effectiveFrom && form.effectiveTo ? (
          <>
            This slot repeats on <span className="font-semibold">{formatDaysOfWeek(form.daysOfWeek)}</span> between the selected dates.
          </>
        ) : (
          <>
            This slot repeats weekly on <span className="font-semibold">{formatDaysOfWeek(form.daysOfWeek)}</span>.
          </>
        )}
        {recurrencePreview && recurrencePreview.length > 0 && (
          <div className="mt-1 text-teal-800">
            Matching booking dates in this range: <span className="font-medium">{recurrencePreview.join(', ')}</span>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl bg-gradient-to-r from-teal-600 to-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:shadow-md disabled:opacity-60"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
