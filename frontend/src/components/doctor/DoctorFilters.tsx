import { Filter, Search } from 'lucide-react';
import { SPECIALTIES } from '../../constants';
import { DOCTOR_DAYS } from '../../constants/doctor';
import type { DoctorSearchParams } from '../../types/doctor';

interface DoctorFiltersProps {
  filters: DoctorSearchParams;
  onChange: (filters: DoctorSearchParams) => void;
  onApply: () => void;
  onReset: () => void;
}

export function DoctorFilters({ filters, onChange, onApply, onReset }: DoctorFiltersProps) {
  return (
    <aside className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-4 w-4 text-teal-600" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Search Filters</h2>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Specialization</span>
          <select
            value={filters.specialization || ''}
            onChange={(e) => onChange({ ...filters, specialization: e.target.value || undefined })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
          >
            <option value="">All specialties</option>
            {SPECIALTIES.map((speciality) => (
              <option key={speciality} value={speciality}>
                {speciality}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Minimum Experience</span>
          <input
            type="number"
            min={0}
            max={60}
            value={filters.minExperience ?? ''}
            onChange={(e) => onChange({
              ...filters,
              minExperience: e.target.value ? Number(e.target.value) : undefined,
            })}
            placeholder="e.g. 5"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Day of Week</span>
          <select
            value={filters.dayOfWeek || ''}
            onChange={(e) => onChange({ ...filters, dayOfWeek: e.target.value || undefined })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
          >
            <option value="">Any day</option>
            {DOCTOR_DAYS.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(filters.verified)}
              onChange={(e) => onChange({ ...filters, verified: e.target.checked ? true : undefined })}
              className="accent-teal-600"
            />
            Verified
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(filters.active)}
              onChange={(e) => onChange({ ...filters, active: e.target.checked ? true : undefined })}
              className="accent-teal-600"
            />
            Active
          </label>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onApply}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-orange-500 px-3 py-2 text-sm font-semibold text-white shadow transition hover:shadow-md"
        >
          <Search className="h-4 w-4" />
          Apply
        </button>
      </div>
    </aside>
  );
}
