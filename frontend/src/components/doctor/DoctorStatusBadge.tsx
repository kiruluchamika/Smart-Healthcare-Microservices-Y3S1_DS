import type { DoctorVerificationStatus } from '../../types/doctor';
import { getVerificationTone } from '../../utils/doctor/doctorFormatters';

interface DoctorStatusBadgeProps {
  status: DoctorVerificationStatus;
}

export function DoctorStatusBadge({ status }: DoctorStatusBadgeProps) {
  const tone = getVerificationTone(status);

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tone.bg} ${tone.text} ${tone.ring}`}>
      {status}
    </span>
  );
}
