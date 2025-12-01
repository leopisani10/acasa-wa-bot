import React, { useState, useEffect } from 'react';
import { X, Calculator, DollarSign } from 'lucide-react';
import { usePayroll } from '../../contexts/PayrollContext';
import { useEmployees } from '../../contexts/EmployeeContext';
import { PayrollRecord } from '../../types';

interface PayrollFormProps {
  payroll?: PayrollRecord;
  onClose: () => void;
  onSave: () => void;
}

export const PayrollForm: React.FC<PayrollFormProps> = ({ payroll, onClose, onSave }) => {
  const { addPayroll, updatePayroll } = usePayroll();
  const { employees } = useEmployees();
  const [loading, setLoading] = useState(false);

  const activeEmployees = employees.filter(e => e.status === 'Ativo');

  const [formData, setFormData] = useState({
    employeeId: payroll?.employeeId || '',
    referenceMonth: payroll?.referenceMonth || new Date().toISOString().slice(0, 7).split('-')[1],
    referenceYear: payroll?.referenceYear || new Date().getFullYear(),
    baseSalary: payroll?.baseSalary || 0,
    overtimeHours: payroll?.overtimeHours || 0,
    overtimeAmount: payroll?.overtimeAmount || 0,
    nightShiftHours: payroll?.nightShiftHours || 0,
    nightShiftAmount: payroll?.nightShiftAmount || 0,
    hazardPay: payroll?.hazardPay || 0,
    foodAllowance: payroll?.foodAllowance || 0,
    transportationAllowance: payroll?.transportationAllowance || 0,
    healthInsurance: payroll?.healthInsurance || 0,
    otherBenefits: payroll?.otherBenefits || 0,
    inssDeduction: payroll?.inssDeduction || 0,
    irrfDeduction: payroll?.irrfDeduction || 0,
    otherDeductions: payroll?.otherDeductions || 0,
    paymentDate: payroll?.paymentDate || '',
    paymentStatus: payroll?.paymentStatus || 'pending',
    paymentMethod: payroll?.paymentMethod || '',
    notes: payroll?.notes || '',
  });

  const calculateGrossAndNet = () => {
    const gross =
      formData.baseSalary +
      formData.overtimeAmount +
      formData.nightShiftAmount +
      formData.hazardPay +
      formData.foodAllowance +
      formData.transportationAllowance +
      formData.healthInsurance +
      formData.otherBenefits;

    const net =
      gross -
      formData.inssDeduction -
      formData.irrfDeduction -
      formData.otherDeductions;

    return { gross, net };
  };

  const { gross: grossSalary, net: netSalary } = calculateGrossAndNet();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeId) {
      alert('Por favor, selecione um colaborador');
      return;
    }

    setLoading(true);

    try {
      const payrollData = {
        ...formData,
        grossSalary,
        netSalary,
        createdBy: '',
      };

      if (payroll) {
        await updatePayroll(payroll.id, payrollData);
      } else {
        await addPayroll(payrollData);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving payroll:', error);
      alert('Erro ao salvar folha de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {payroll ? 'Editar Folha de Pagamento' : 'Nova Folha de Pagamento'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colaborador *
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                required
              >
                <option value="">Selecione um colaborador</option>
                {activeEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName} - {employee.position}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mês de Referência *
              </label>
              <select
                value={formData.referenceMonth}
                onChange={(e) => setFormData({ ...formData, referenceMonth: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                required
              >
                {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(month => (
                  <option key={month} value={month}>
                    {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][parseInt(month) - 1]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ano de Referência *
              </label>
              <input
                type="number"
                value={formData.referenceYear}
                onChange={(e) => setFormData({ ...formData, referenceYear: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                required
              />
            </div>

            <div className="col-span-2 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-acasa-purple" />
                Valores Base
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salário Base *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.baseSalary}
                onChange={(e) => setFormData({ ...formData, baseSalary: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horas Extras
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.overtimeHours}
                onChange={(e) => setFormData({ ...formData, overtimeHours: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Horas Extras
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.overtimeAmount}
                onChange={(e) => setFormData({ ...formData, overtimeAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horas Noturnas
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.nightShiftHours}
                onChange={(e) => setFormData({ ...formData, nightShiftHours: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adicional Noturno
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.nightShiftAmount}
                onChange={(e) => setFormData({ ...formData, nightShiftAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Insalubridade/Periculosidade
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.hazardPay}
                onChange={(e) => setFormData({ ...formData, hazardPay: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
              />
            </div>

            <div className="col-span-2 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefícios</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vale Alimentação
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.foodAllowance}
                onChange={(e) => setFormData({ ...formData, foodAllowance: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vale Transporte
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.transportationAllowance}
                onChange={(e) => setFormData({ ...formData, transportationAllowance: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plano de Saúde
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.healthInsurance}
                onChange={(e) => setFormData({ ...formData, healthInsurance: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outros Benefícios
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.otherBenefits}
                onChange={(e) => setFormData({ ...formData, otherBenefits: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
              />
            </div>

            <div className="col-span-2 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Descontos</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                INSS
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.inssDeduction}
                onChange={(e) => setFormData({ ...formData, inssDeduction: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IRRF
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.irrfDeduction}
                onChange={(e) => setFormData({ ...formData, irrfDeduction: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outros Descontos
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.otherDeductions}
                onChange={(e) => setFormData({ ...formData, otherDeductions: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
              />
            </div>

            <div className="col-span-2 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-acasa-purple" />
                Resumo
              </h3>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Salário Bruto</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(grossSalary)}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Salário Líquido</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(netSalary)}</p>
            </div>

            <div className="col-span-2 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pagamento</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status do Pagamento
              </label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
              >
                <option value="pending">Pendente</option>
                <option value="processing">Processando</option>
                <option value="paid">Pago</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pagamento
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
              >
                <option value="">Selecione</option>
                <option value="bank_transfer">Transferência Bancária</option>
                <option value="check">Cheque</option>
                <option value="cash">Dinheiro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Pagamento
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                placeholder="Observações adicionais..."
              />
            </div>
          </div>
          </div>
        </form>

        <div className="flex justify-end gap-4 p-6 border-t border-gray-200 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              const form = e.currentTarget.closest('.flex.flex-col')?.querySelector('form');
              if (form) {
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }
            }}
            className="px-6 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Salvando...' : payroll ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};
