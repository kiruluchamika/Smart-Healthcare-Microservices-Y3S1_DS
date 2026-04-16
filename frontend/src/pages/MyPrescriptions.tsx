import React from 'react';
import { getAuthUser } from '../services/authSession';
import PrescriptionList from '../components/patient/PrescriptionList';

export default function MyPrescriptions() {
  const user = getAuthUser();
  if (!user?.id) return <div>Please log in to view your prescriptions.</div>;
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-3xl mx-auto">
        <PrescriptionList patientId={user.id} />
      </div>
    </div>
  );
}
