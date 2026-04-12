import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { syncCheckoutSession, type PaymentResponse } from '../../services/paymentApi';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const sessionId = searchParams.get('session_id');
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentResponse | null>(null);
  const appointmentsLink = appointmentId
    ? `/appointments?refreshPaymentFor=${encodeURIComponent(appointmentId)}`
    : '/appointments';

  const consultationPhaseMessage = (() => {
    const appointmentType = paymentDetails?.appointmentType?.toUpperCase();
    if (!appointmentType) {
      return 'Your appointment is ready for the next step.';
    }

    if (appointmentType === 'VIDEO') {
      return 'Video consultation phase: open your appointment to see room access, waiting status, and join guidance.';
    }

    if (appointmentType === 'PHYSICAL') {
      return 'Physical consultation phase: please arrive a little early at the clinic on the appointment date.';
    }

    return 'Your appointment is ready for the next step.';
  })();

  const syncPanel = (() => {
    if (!sessionId) {
      return null;
    }

    if (syncState === 'syncing') {
      return {
        tone: 'border-blue-200 bg-blue-50 text-blue-800',
        icon: <Loader2 className="h-5 w-5 animate-spin" />,
        title: 'Payment confirmed. Syncing with your appointment...',
        message: 'Stripe returned successfully, and we are now updating your appointment record.',
      };
    }

    if (syncState === 'success') {
      return {
        tone: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        icon: <CheckCircle2 className="h-5 w-5" />,
        title: 'Payment confirmed and synced',
        message:
          syncMessage || 'Your appointment and doctor view are now updated with the paid status.',
      };
    }

    if (syncState === 'error') {
      return {
        tone: 'border-amber-200 bg-amber-50 text-amber-800',
        icon: <AlertTriangle className="h-5 w-5" />,
        title: 'Payment detected, but sync needs another check',
        message:
          syncMessage || 'We could not confirm the backend sync yet. Refresh after a few seconds.',
      };
    }

    return null;
  })();

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let isMounted = true;

    const syncPayment = async () => {
      setSyncState('syncing');
      setSyncMessage('');

      try {
        const response = await syncCheckoutSession(sessionId);
        if (!isMounted) {
          return;
        }

        setSyncState('success');
        setPaymentDetails(response);
        setSyncMessage(
          response.status === 'PAID' || response.status === 'COMPLETED'
            ? 'Payment confirmed and synced.'
            : 'Checkout session synced.',
        );
      } catch (syncError) {
        if (!isMounted) {
          return;
        }

        setSyncState('error');
        setSyncMessage(syncError instanceof Error ? syncError.message : 'Unable to confirm payment yet.');
      }
    };

    void syncPayment();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-emerald-200 bg-white p-8 shadow-lg">
        <div className="mb-5 inline-flex rounded-full bg-emerald-100 p-3 text-emerald-700">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900">Payment Successful</h1>
        <p className="mt-2 text-gray-600">
          Your consultation payment has been confirmed. The appointment is now ready for your channeling flow.
        </p>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Next step</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">{consultationPhaseMessage}</h2>
          {paymentDetails?.appointmentType && (
            <p className="mt-2 text-sm text-slate-600">
              Consultation type: {paymentDetails.appointmentType === 'VIDEO' ? 'Video' : 'Physical'}
            </p>
          )}
        </div>

        {syncPanel && (
          <div className={`mt-5 rounded-2xl border px-5 py-4 ${syncPanel.tone}`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{syncPanel.icon}</div>
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-wide">Payment status</p>
                <h2 className="mt-1 text-lg font-bold">{syncPanel.title}</h2>
                <p className="mt-1 text-sm opacity-90">{syncPanel.message}</p>
              </div>
            </div>
          </div>
        )}

        {appointmentId && (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Appointment ID: {appointmentId}
          </p>
        )}

        <p className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          Warning: This channeling payment is non-refundable.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {appointmentId && paymentDetails?.appointmentType?.toUpperCase() === 'VIDEO' && (
            <Link
              to={`/consultation/${encodeURIComponent(appointmentId)}`}
              className="rounded-lg bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              View Consultation Access
            </Link>
          )}
          <Link
            to={appointmentsLink}
            className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Back to My Appointments
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
