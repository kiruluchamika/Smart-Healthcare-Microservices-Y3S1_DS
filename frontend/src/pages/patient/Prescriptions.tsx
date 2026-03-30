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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Prescriptions</h1>
        <p className="mt-1 text-sm text-gray-500">Medications ordered by your doctors.</p>
      </div>

      <div className="bg-white px-4 py-12 border border-gray-200 rounded-lg shadow-sm text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
          <span className="text-2xl">🚧</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900">Feature Coming Soon</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
          The Prescriptions feature will be available once the Pharmacy and Doctor Services are fully integrated. Thank you for your patience!
        </p>
      </div>
    </div>
  );
};

export default PrescriptionsPage;
