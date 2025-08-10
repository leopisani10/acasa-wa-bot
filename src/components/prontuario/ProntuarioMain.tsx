import React, { useState } from 'react';
import { ProntuarioProvider } from '../../contexts/ProntuarioContext';
import { GuestListForTechnical } from './GuestListForTechnical';
import { GuestMedicalRecord } from './GuestMedicalRecord';
import { Guest } from '../../types';

const ProntuarioContent: React.FC = () => {
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const handleSelectGuest = (guest: Guest) => {
    setSelectedGuest(guest);
  };

  const handleBackToList = () => {
    setSelectedGuest(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!selectedGuest ? (
        <GuestListForTechnical onSelectGuest={handleSelectGuest} />
      ) : (
        <GuestMedicalRecord guest={selectedGuest} onBack={handleBackToList} />
      )}
    </div>
  );
};

export const ProntuarioMain: React.FC = () => {
  return (
    <ProntuarioProvider>
      <ProntuarioContent />
    </ProntuarioProvider>
  );
};