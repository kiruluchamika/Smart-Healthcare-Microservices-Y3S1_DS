import React from 'react';
import { signPrescription } from '../../services/prescriptionApi';

export default function PrescriptionSignButton({ prescriptionId, onSigned }: { prescriptionId: number, onSigned?: (prescription: any) => void }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSign = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await signPrescription(prescriptionId);
      if (onSigned) onSigned(resp);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to sign prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button className="btn btn-success" onClick={handleSign} disabled={loading}>
        {loading ? 'Signing...' : 'Sign Prescription'}
      </button>
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
}
