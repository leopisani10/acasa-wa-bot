import React, { useState } from 'react';
import { List, Calendar as CalendarIcon } from 'lucide-react';
import { PayrollList } from './PayrollList';
import { PayrollForm } from './PayrollForm';
import { PayrollCalendar } from './PayrollCalendar';
import { PayrollRecord } from '../../types';

export const PayrollManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');
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
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'list'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <List className="w-5 h-5" />
              Lista de Folhas
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'calendar'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CalendarIcon className="w-5 h-5" />
              Calendário
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'list' && (
        <PayrollList onAddPayroll={handleAddPayroll} onEditPayroll={handleEditPayroll} />
      )}

      {activeTab === 'calendar' && (
        <PayrollCalendar />
      )}

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
