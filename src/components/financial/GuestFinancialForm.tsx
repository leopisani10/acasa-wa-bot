import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Save, TrendingUp, X, AlertCircle } from 'lucide-react';
import { GuestFinancialRecord } from '../../types/financial';
import { useFinancial } from '../../contexts/FinancialContext';
import { Guest } from '../../types';
import { MonthSelector } from './MonthSelector';

interface GuestFinancialFormProps {
  guest: Guest;
  record?: GuestFinancialRecord;
  onClose: () => void;
  onSave: () => void;
}

export const GuestFinancialForm: React.FC<GuestFinancialFormProps> = ({ guest, record, onClose, onSave }) => {
  const { createFinancialRecord, updateFinancialRecord, createAdjustment, recordNoAdjustment, getNoAdjustmentHistory } = useFinancial();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toISOString().substring(0, 7);

  const [formData, setFormData] = useState({
    monthlyFee: 0,
    monthlyDueDay: 10,
    climatizationFee: 0,
    climatizationDueDay: 10,
    climatizationInstallments: 1,
    climatizationStartMonth: currentMonth,
    climatizationSelectedMonths: [] as string[],
    maintenanceFee: 0,
    maintenanceDueDay: 10,
    maintenanceInstallments: 1,
    maintenanceStartMonth: currentMonth,
    maintenanceSelectedMonths: [] as string[],
    trousseauFee: 0,
    trousseauDueDay: 10,
    trousseauInstallments: 1,
    trousseauStartMonth: currentMonth,
    trousseauSelectedMonths: [] as string[],
    thirteenthSalaryFee: 0,
    thirteenthSalaryDueDay: 10,
    thirteenthSalaryInstallments: 1,
    thirteenthSalaryStartMonth: currentMonth,
    thirteenthSalarySelectedMonths: [] as string[],
    adjustedCurrentYear: false,
    retroactiveAmount: 0,
    adjustmentYear: currentYear,
  });

  const [showAdjustment, setShowAdjustment] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    percentage: 0,
    newMonthlyFee: 0,
    notes: '',
  });

  const [showNoAdjustment, setShowNoAdjustment] = useState(false);
  const [noAdjustmentData, setNoAdjustmentData] = useState({
    year: currentYear,
    reason: '',
  });

  const noAdjustmentHistory = record ? getNoAdjustmentHistory(guest.id) : [];

  useEffect(() => {
    if (record) {
      setFormData({
        monthlyFee: record.monthlyFee,
        monthlyDueDay: record.monthlyDueDay,
        climatizationFee: record.climatizationFee,
        climatizationDueDay: record.climatizationDueDay,
        climatizationInstallments: record.climatizationInstallments,
        climatizationStartMonth: record.climatizationStartMonth || currentMonth,
        climatizationSelectedMonths: record.climatizationSelectedMonths || [],
        maintenanceFee: record.maintenanceFee,
        maintenanceDueDay: record.maintenanceDueDay,
        maintenanceInstallments: record.maintenanceInstallments,
        maintenanceStartMonth: record.maintenanceStartMonth || currentMonth,
        maintenanceSelectedMonths: record.maintenanceSelectedMonths || [],
        trousseauFee: record.trousseauFee,
        trousseauDueDay: record.trousseauDueDay,
        trousseauInstallments: record.trousseauInstallments,
        trousseauStartMonth: record.trousseauStartMonth || currentMonth,
        trousseauSelectedMonths: record.trousseauSelectedMonths || [],
        thirteenthSalaryFee: record.thirteenthSalaryFee,
        thirteenthSalaryDueDay: record.thirteenthSalaryDueDay,
        thirteenthSalaryInstallments: record.thirteenthSalaryInstallments,
        thirteenthSalaryStartMonth: record.thirteenthSalaryStartMonth || currentMonth,
        thirteenthSalarySelectedMonths: record.thirteenthSalarySelectedMonths || [],
        adjustedCurrentYear: record.adjustedCurrentYear,
        retroactiveAmount: record.retroactiveAmount,
        adjustmentYear: record.adjustmentYear || currentYear,
      });
    }
  }, [record]);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: parseFloat(value) || 0 });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

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

  const handleNoAdjustment = async () => {
    if (!record || !noAdjustmentData.reason.trim()) {
      alert('Por favor, informe o motivo da não aplicação do reajuste');
      return;
    }

    try {
      await recordNoAdjustment(guest.id, noAdjustmentData.year, noAdjustmentData.reason);
      setShowNoAdjustment(false);
      setNoAdjustmentData({ year: currentYear, reason: '' });
      alert('Registro de não reajuste salvo com sucesso!');
      onSave();
    } catch (error) {
      console.error('Error recording no adjustment:', error);
      alert('Erro ao registrar não reajuste');
    }
  };

  const totalMonthly = formData.monthlyFee + formData.climatizationFee + formData.maintenanceFee + formData.trousseauFee;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8 max-h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Dados Financeiros</h2>
            <p className="text-sm text-gray-600 mt-1">{guest.fullName}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Responsável: {guest.financialResponsibleName || 'Sem Responsável'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(100vh-16rem)]">
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
                <MonthSelector
                  label="Selecionar Meses de Cobrança"
                  selectedMonths={formData.climatizationSelectedMonths}
                  onChange={(months) => setFormData({ ...formData, climatizationSelectedMonths: months })}
                  year={2026}
                />
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
                <MonthSelector
                  label="Selecionar Meses de Cobrança"
                  selectedMonths={formData.maintenanceSelectedMonths}
                  onChange={(months) => setFormData({ ...formData, maintenanceSelectedMonths: months })}
                  year={2026}
                />
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
                <MonthSelector
                  label="Selecionar Meses de Cobrança"
                  selectedMonths={formData.trousseauSelectedMonths}
                  onChange={(months) => setFormData({ ...formData, trousseauSelectedMonths: months })}
                  year={2026}
                />
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 md:col-span-2">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <DollarSign className="mr-2 text-red-600" size={20} />
                Décimo Terceiro
              </h3>
              <div className="space-y-4">
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
                <MonthSelector
                  label="Selecionar Meses de Cobrança"
                  selectedMonths={formData.thirteenthSalarySelectedMonths}
                  onChange={(months) => setFormData({ ...formData, thirteenthSalarySelectedMonths: months })}
                  year={2026}
                />
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 md:col-span-2 bg-yellow-50">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <TrendingUp className="mr-2 text-yellow-600" size={20} />
                Reajuste Anual {currentYear}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="adjustedCurrentYear"
                    checked={formData.adjustedCurrentYear}
                    onChange={(e) => setFormData({ ...formData, adjustedCurrentYear: e.target.checked })}
                    className="w-4 h-4 text-acasa-purple border-gray-300 rounded focus:ring-acasa-purple"
                  />
                  <label htmlFor="adjustedCurrentYear" className="ml-2 text-sm font-medium text-gray-700">
                    Reajustado em {currentYear}
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Retroativo (Jan)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.retroactiveAmount}
                    onChange={(e) => handleInputChange('retroactiveAmount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled={!formData.adjustedCurrentYear}
                  />
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Cobrado em Fevereiro</p>
                    <p className="text-lg font-bold text-yellow-600">
                      + R$ {formData.retroactiveAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                O reajuste é aplicado em janeiro, mas a diferença (retroativo) é cobrada em fevereiro junto com a mensalidade.
              </p>
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

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowNoAdjustment(!showNoAdjustment)}
                  className="flex items-center text-orange-600 hover:text-orange-800 font-medium"
                >
                  <AlertCircle className="mr-2" size={20} />
                  {showNoAdjustment ? 'Cancelar' : 'Registrar Não Reajuste'}
                </button>

                {showNoAdjustment && (
                  <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-gray-900 mb-4">Não Aplicação de Reajuste</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ano de Referência
                        </label>
                        <select
                          value={noAdjustmentData.year}
                          onChange={(e) => setNoAdjustmentData({ ...noAdjustmentData, year: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          {[currentYear - 1, currentYear, currentYear + 1].map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Motivo da Não Aplicação do Reajuste *
                        </label>
                        <textarea
                          value={noAdjustmentData.reason}
                          onChange={(e) => setNoAdjustmentData({ ...noAdjustmentData, reason: e.target.value })}
                          placeholder="Ex: Acordo com familiar, hóspede em situação financeira delicada, etc."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          rows={3}
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleNoAdjustment}
                      className="mt-4 w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      Confirmar Registro
                    </button>
                  </div>
                )}

                {noAdjustmentHistory.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3 text-sm">Histórico de Não Reajustes</h4>
                    <div className="space-y-2">
                      {noAdjustmentHistory.map((item) => (
                        <div key={item.id} className="text-xs p-2 bg-white rounded border border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-900">Ano: {item.year}</span>
                            <span className="text-gray-500">{new Date(item.recordedDate).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <p className="text-gray-700">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-acasa-red flex items-center justify-center"
          >
            <Save className="mr-2" size={20} />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
