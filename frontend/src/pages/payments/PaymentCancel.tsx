import { AlertTriangle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export default function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-white p-8 shadow-lg">
        <div className="mb-5 inline-flex rounded-full bg-amber-100 p-3 text-amber-700">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900">Payment Not Completed</h1>
        <p className="mt-2 text-gray-600">
          You cancelled or exited the checkout. Your appointment is still pending payment.
        </p>

        {appointmentId && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Appointment ID: {appointmentId}
          </p>
        )}

        <p className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          Reminder: payment is required only after doctor approval, and successful payments are non-refundable.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/appointments"
            className="rounded-lg bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            Return to My Appointments
          </Link>
          <Link
            to="/dashboard"
            className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
