import React, { useState } from 'react';
import { PayrollList } from './PayrollList';
import { PayrollForm } from './PayrollForm';
import { PayrollRecord } from '../../types';

export const PayrollManager: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<PayrollRecord | undefined>();

  const handleAddPayroll = () => {
    setEditingPayroll(undefined);
    setShowForm(true);
  };

  const handleEditPayroll = (payroll: PayrollRecord) => {
    setEditingPayroll(payroll);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPayroll(undefined);
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingPayroll(undefined);
  };

  return (
    <>
      <PayrollList onAddPayroll={handleAddPayroll} onEditPayroll={handleEditPayroll} />

      {showForm && (
        <PayrollForm
          payroll={editingPayroll}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}
    </>
  );
};
