import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Save, TrendingUp, X } from 'lucide-react';
import { GuestFinancialRecord } from '../../types/financial';
import { useFinancial } from '../../contexts/FinancialContext';
import { Guest } from '../../types';

interface GuestFinancialFormProps {
  guest: Guest;
  record?: GuestFinancialRecord;
  onClose: () => void;
  onSave: () => void;
}

export const GuestFinancialForm: React.FC<GuestFinancialFormProps> = ({ guest, record, onClose, onSave }) => {
  const { createFinancialRecord, updateFinancialRecord, createAdjustment } = useFinancial();
  const [formData, setFormData] = useState({
    monthlyFee: 0,
    monthlyDueDay: 10,
    climatizationFee: 0,
    climatizationDueDay: 10,
    maintenanceFee: 0,
    maintenanceDueDay: 10,
    trousseauFee: 0,
    trousseauDueDay: 10,
    thirteenthSalaryFee: 0,
    thirteenthSalaryDueDay: 10,
  });

  const [showAdjustment, setShowAdjustment] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    percentage: 0,
    newMonthlyFee: 0,
    notes: '',
  });

  useEffect(() => {
    if (record) {
      setFormData({
        monthlyFee: record.monthlyFee,
        monthlyDueDay: record.monthlyDueDay,
        climatizationFee: record.climatizationFee,
        climatizationDueDay: record.climatizationDueDay,
        maintenanceFee: record.maintenanceFee,
        maintenanceDueDay: record.maintenanceDueDay,
        trousseauFee: record.trousseauFee,
        trousseauDueDay: record.trousseauDueDay,
        thirteenthSalaryFee: record.thirteenthSalaryFee,
        thirteenthSalaryDueDay: record.thirteenthSalaryDueDay,
      });
    }
  }, [record]);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: parseFloat(value) || 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (record) {
        await updateFinancialRecord(record.id, formData);
      } else {
        await createFinancialRecord({
          guestId: guest.id,
          ...formData,
          isActive: guest.status === 'Ativo',
          revenueLoss: 0,
        });
      }
      onSave();
    } catch (error) {
      console.error('Error saving financial record:', error);
      alert('Erro ao salvar registro financeiro');
    }
  };

  const handleAdjustment = async () => {
    if (!record || adjustmentData.percentage === 0) return;

    try {
      const newFee = adjustmentData.newMonthlyFee > 0
        ? adjustmentData.newMonthlyFee
        : formData.monthlyFee * (1 + adjustmentData.percentage / 100);

      await createAdjustment({
        guestId: guest.id,
        adjustmentDate: new Date().toISOString().split('T')[0],
        previousMonthlyFee: formData.monthlyFee,
        newMonthlyFee: newFee,
        adjustmentPercentage: adjustmentData.percentage,
        notes: adjustmentData.notes,
      });

      await updateFinancialRecord(record.id, {
        monthlyFee: newFee,
      });

      setFormData({ ...formData, monthlyFee: newFee });
      setShowAdjustment(false);
      setAdjustmentData({ percentage: 0, newMonthlyFee: 0, notes: '' });
      alert('Reajuste aplicado com sucesso!');
    } catch (error) {
      console.error('Error applying adjustment:', error);
      alert('Erro ao aplicar reajuste');
    }
  };

  const calculatePercentage = () => {
    if (adjustmentData.newMonthlyFee > 0 && formData.monthlyFee > 0) {
      const percentage = ((adjustmentData.newMonthlyFee - formData.monthlyFee) / formData.monthlyFee) * 100;
      setAdjustmentData({ ...adjustmentData, percentage: Math.round(percentage * 100) / 100 });
    }
  };

  const calculateNewFee = () => {
    if (adjustmentData.percentage !== 0 && formData.monthlyFee > 0) {
      const newFee = formData.monthlyFee * (1 + adjustmentData.percentage / 100);
      setAdjustmentData({ ...adjustmentData, newMonthlyFee: Math.round(newFee * 100) / 100 });
    }
  };

  const totalMonthly = formData.monthlyFee + formData.climatizationFee + formData.maintenanceFee + formData.trousseauFee;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Dados Financeiros</h2>
            <p className="text-sm text-gray-600 mt-1">{guest.fullName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <DollarSign className="mr-2 text-green-600" size={20} />
                Mensalidade
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monthlyFee}
                    onChange={(e) => handleInputChange('monthlyFee', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dia do Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.monthlyDueDay}
                    onChange={(e) => setFormData({ ...formData, monthlyDueDay: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <DollarSign className="mr-2 text-blue-600" size={20} />
                Climatização
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.climatizationFee}
                    onChange={(e) => handleInputChange('climatizationFee', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dia do Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.climatizationDueDay}
                    onChange={(e) => setFormData({ ...formData, climatizationDueDay: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <DollarSign className="mr-2 text-purple-600" size={20} />
                Manutenção
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.maintenanceFee}
                    onChange={(e) => handleInputChange('maintenanceFee', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dia do Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.maintenanceDueDay}
                    onChange={(e) => setFormData({ ...formData, maintenanceDueDay: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <DollarSign className="mr-2 text-orange-600" size={20} />
                Enxoval
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.trousseauFee}
                    onChange={(e) => handleInputChange('trousseauFee', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dia do Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.trousseauDueDay}
                    onChange={(e) => setFormData({ ...formData, trousseauDueDay: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 md:col-span-2">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <DollarSign className="mr-2 text-red-600" size={20} />
                Décimo Terceiro
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.thirteenthSalaryFee}
                    onChange={(e) => handleInputChange('thirteenthSalaryFee', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dia do Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.thirteenthSalaryDueDay}
                    onChange={(e) => setFormData({ ...formData, thirteenthSalaryDueDay: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total Mensal</span>
              <span className="text-2xl font-bold text-green-600">
                R$ {totalMonthly.toFixed(2)}
              </span>
            </div>
          </div>

          {record && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={() => setShowAdjustment(!showAdjustment)}
                className="flex items-center text-acasa-purple hover:text-acasa-red font-medium"
              >
                <TrendingUp className="mr-2" size={20} />
                {showAdjustment ? 'Cancelar Reajuste' : 'Aplicar Reajuste'}
              </button>

              {showAdjustment && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-gray-900 mb-4">Reajuste de Mensalidade</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Percentual de Reajuste (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={adjustmentData.percentage}
                        onChange={(e) => setAdjustmentData({ ...adjustmentData, percentage: parseFloat(e.target.value) || 0 })}
                        onBlur={calculateNewFee}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Novo Valor da Mensalidade
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={adjustmentData.newMonthlyFee}
                        onChange={(e) => setAdjustmentData({ ...adjustmentData, newMonthlyFee: parseFloat(e.target.value) || 0 })}
                        onBlur={calculatePercentage}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observações
                      </label>
                      <textarea
                        value={adjustmentData.notes}
                        onChange={(e) => setAdjustmentData({ ...adjustmentData, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows={2}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAdjustment}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Confirmar Reajuste
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-acasa-red flex items-center justify-center"
            >
              <Save className="mr-2" size={20} />
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
