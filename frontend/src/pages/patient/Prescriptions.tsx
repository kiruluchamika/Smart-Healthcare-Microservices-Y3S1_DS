import React, { useEffect, useState } from 'react';
import { patientApi } from '../../services/patientApi';

const PrescriptionsPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const res = await patientApi.getPrescriptions();
        if (res.success) {
          setPrescriptions(res.data);
        }
      } catch (err) {
        // Mock error for now since microservice isn't ready
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);

  return (
    <div className="patient-shell px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-900">Your Prescriptions</h1>
          <p className="mt-1 text-sm text-slate-600">Medications ordered by your doctors.</p>
        </div>

        <div className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
          {loading ? 'Loading prescriptions...' : `${prescriptions.length} prescriptions synced`}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 shadow-sm text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-slate-100 mb-4">
            <span className="text-2xl">🚧</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Feature Coming Soon</h3>
          <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">
            The Prescriptions feature will be available once the Pharmacy and Doctor Services are fully integrated. Thank you for your patience!
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionsPage;
