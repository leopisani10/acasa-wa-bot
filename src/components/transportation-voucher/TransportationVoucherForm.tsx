import React, { useState, useEffect } from 'react';
import { Save, X, Calculator } from 'lucide-react';
import { TransportationVoucher } from '../../types';
import { useTransportationVouchers } from '../../contexts/TransportationVoucherContext';
import { useEmployees } from '../../contexts/EmployeeContext';

interface TransportationVoucherFormProps {
  voucher?: TransportationVoucher;
  onClose: () => void;
  onSave: () => void;
}

export const TransportationVoucherForm: React.FC<TransportationVoucherFormProps> = ({
  voucher,
  onClose,
  onSave
}) => {
  const { addVoucher, updateVoucher } = useTransportationVouchers();
  const { employees } = useEmployees();
  const [isLoading, setIsLoading] = useState(false);

  const activeEmployees = employees.filter(e => e.status === 'Ativo' && e.receivesTransportation);

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState({
    employeeId: voucher?.employeeId || '',
    referenceMonth: voucher?.referenceMonth || getCurrentMonth(),
    dailyValue: voucher?.dailyValue || 0,
    workingDays: voucher?.workingDays || 22,
    totalValue: voucher?.totalValue || 0,
    paymentDate: voucher?.paymentDate || '',
    paid: voucher?.paid || false,
    notes: voucher?.notes || '',
  });

  useEffect(() => {
    const total = formData.dailyValue * formData.workingDays;
    setFormData(prev => ({ ...prev, totalValue: total }));
  }, [formData.dailyValue, formData.workingDays]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (voucher) {
        await updateVoucher(voucher.id, formData);
      } else {
        await addVoucher({
          ...formData,
          createdBy: '',
          createdAt: '',
          updatedAt: '',
        });
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving voucher:', error);
      alert('Erro ao salvar vale transporte');
    } finally {
      setIsLoading(false);
    }
  };

  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${months[parseInt(month) - 1]} de ${year}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {voucher ? 'Editar' : 'Novo'} Vale Transporte
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colaborador *
              </label>
              <select
                required
                value={formData.employeeId}
                onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione um colaborador</option>
                {activeEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mês de Referência *
              </label>
              <input
                type="month"
                required
                value={formData.referenceMonth}
                onChange={(e) => setFormData(prev => ({ ...prev, referenceMonth: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formatMonthDisplay(formData.referenceMonth)}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Calculator className="text-blue-600 mr-2" size={20} />
              <h3 className="font-medium text-gray-900">Cálculo do Vale Transporte</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Diário (Ida e Volta) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.dailyValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, dailyValue: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dias Trabalhados *
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={formData.workingDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, workingDays: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-white rounded border border-blue-300">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Valor Total:</span>
                <span className="text-xl font-bold text-blue-600">
                  R$ {formData.totalValue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data do Pagamento
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center pt-7">
              <input
                type="checkbox"
                id="paid"
                checked={formData.paid}
                onChange={(e) => setFormData(prev => ({ ...prev, paid: e.target.checked }))}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="paid" className="text-sm font-medium text-gray-700">
                Vale Transporte Pago
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observações adicionais..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save size={20} className="mr-2" />
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
