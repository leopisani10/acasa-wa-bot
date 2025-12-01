import React, { useState } from 'react';
import { LaborAgreementList } from './LaborAgreementList';
import { LaborAgreementForm } from './LaborAgreementForm';
import { LaborAgreementDetails } from './LaborAgreementDetails';
import { LaborAgreementWithInstallments } from '../../types';

export const LaborAgreementManager: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<LaborAgreementWithInstallments | undefined>();
  const [viewingAgreement, setViewingAgreement] = useState<LaborAgreementWithInstallments | undefined>();

  const handleAddAgreement = () => {
    setEditingAgreement(undefined);
    setShowForm(true);
  };

  const handleEditAgreement = (agreement: LaborAgreementWithInstallments) => {
    setEditingAgreement(agreement);
    setShowForm(true);
    setShowDetails(false);
  };

  const handleViewAgreement = (agreement: LaborAgreementWithInstallments) => {
    setViewingAgreement(agreement);
    setShowDetails(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAgreement(undefined);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setViewingAgreement(undefined);
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingAgreement(undefined);
  };

  const handleEditFromDetails = () => {
    if (viewingAgreement) {
      setEditingAgreement(viewingAgreement);
      setShowDetails(false);
      setShowForm(true);
    }
  };

  return (
    <>
      <LaborAgreementList
        onAddAgreement={handleAddAgreement}
        onViewAgreement={handleViewAgreement}
        onEditAgreement={handleEditAgreement}
      />

      {showForm && (
        <LaborAgreementForm
          agreement={editingAgreement}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}

      {showDetails && viewingAgreement && (
        <LaborAgreementDetails
          agreement={viewingAgreement}
          onClose={handleCloseDetails}
          onEdit={handleEditFromDetails}
        />
      )}
    </>
  );
};
