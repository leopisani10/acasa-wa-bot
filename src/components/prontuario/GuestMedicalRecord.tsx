import React from 'react';
import { Guest } from '../../types';
import { PatientDashboard } from './PatientDashboard';

interface GuestMedicalRecordProps {
  guest: Guest;
  onBack: () => void;
}

export const GuestMedicalRecord: React.FC<GuestMedicalRecordProps> = ({ guest, onBack }) => {
  return <PatientDashboard guest={guest} onBack={onBack} />;
};