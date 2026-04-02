import { History } from 'lucide-react';
import type { DoctorVerificationHistoryItem } from '../../types/doctor';
import { formatDateTime } from '../../utils/doctor/doctorFormatters';
import { DoctorStatusBadge } from './DoctorStatusBadge';

interface VerificationTimelineProps {
  items: DoctorVerificationHistoryItem[];
}

export function VerificationTimeline({ items }: VerificationTimelineProps) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
        No verification history entries yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-4 w-4 text-teal-600" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Verification History</h3>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <DoctorStatusBadge status={item.previousStatus} />
              <span className="text-xs text-slate-500">to</span>
              <DoctorStatusBadge status={item.newStatus} />
            </div>
            <p className="text-sm font-semibold text-slate-800">Changed by {item.changedBy}</p>
            <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.changedAt)}</p>
            {item.reason && <p className="mt-2 text-sm text-slate-700">Reason: {item.reason}</p>}
            {item.notes && <p className="mt-1 text-sm text-slate-700">Notes: {item.notes}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
