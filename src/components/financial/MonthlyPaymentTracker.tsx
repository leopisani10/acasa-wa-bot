import React, { useState } from 'react';
import { Check, X, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { useFinancial } from '../../contexts/FinancialContext';
import { Guest } from '../../types';

interface MonthlyPaymentTrackerProps {
  guest: Guest;
  onClose: () => void;
}

export const MonthlyPaymentTracker: React.FC<MonthlyPaymentTrackerProps> = ({ guest, onClose }) => {
  const { recordMonthlyPayment, getMonthlyPayments, getFinancialRecord } = useFinancial();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    paid: false,
    expectedAmount: 0,
    amountPaid: 0,
    paymentDate: '',
    paymentNotes: '',
  });

  const payments = getMonthlyPayments(guest.id);
  const financialRecord = getFinancialRecord(guest.id);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const isMonthInInstallmentPeriod = (currentMonth: string, startMonth: string, installments: number): boolean => {
    const [startYear, startMonthNum] = startMonth.split('-').map(Number);
    const [currentYear, currentMonthNum] = currentMonth.split('-').map(Number);

    const startMonthIndex = startYear * 12 + startMonthNum;
    const currentMonthIndex = currentYear * 12 + currentMonthNum;
    const endMonthIndex = startMonthIndex + installments - 1;

    return currentMonthIndex >= startMonthIndex && currentMonthIndex <= endMonthIndex;
  };

  const getExpectedAmount = (monthIndex: number): number => {
    if (!financialRecord) return 0;

    let total = financialRecord.monthlyFee;

    const monthKey = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;

    // Climatização: prioriza meses selecionados, senão usa cálculo sequencial
    if (financialRecord.climatizationSelectedMonths && financialRecord.climatizationSelectedMonths.length > 0) {
      if (financialRecord.climatizationSelectedMonths.includes(monthKey)) {
        total += financialRecord.climatizationFee;
      }
    } else if (financialRecord.climatizationStartMonth && isMonthInInstallmentPeriod(monthKey, financialRecord.climatizationStartMonth, financialRecord.climatizationInstallments)) {
      total += financialRecord.climatizationFee;
    }

    // Manutenção: prioriza meses selecionados, senão usa cálculo sequencial
    if (financialRecord.maintenanceSelectedMonths && financialRecord.maintenanceSelectedMonths.length > 0) {
      if (financialRecord.maintenanceSelectedMonths.includes(monthKey)) {
        total += financialRecord.maintenanceFee;
      }
    } else if (financialRecord.maintenanceStartMonth && isMonthInInstallmentPeriod(monthKey, financialRecord.maintenanceStartMonth, financialRecord.maintenanceInstallments)) {
      total += financialRecord.maintenanceFee;
    }

    // Enxoval: prioriza meses selecionados, senão usa cálculo sequencial
    if (financialRecord.trousseauSelectedMonths && financialRecord.trousseauSelectedMonths.length > 0) {
      if (financialRecord.trousseauSelectedMonths.includes(monthKey)) {
        total += financialRecord.trousseauFee;
      }
    } else if (financialRecord.trousseauStartMonth && isMonthInInstallmentPeriod(monthKey, financialRecord.trousseauStartMonth, financialRecord.trousseauInstallments)) {
      total += financialRecord.trousseauFee;
    }

    // Décimo Terceiro: prioriza meses selecionados, senão usa cálculo sequencial
    if (financialRecord.thirteenthSalarySelectedMonths && financialRecord.thirteenthSalarySelectedMonths.length > 0) {
      if (financialRecord.thirteenthSalarySelectedMonths.includes(monthKey)) {
        total += financialRecord.thirteenthSalaryFee;
      }
    } else if (financialRecord.thirteenthSalaryStartMonth && isMonthInInstallmentPeriod(monthKey, financialRecord.thirteenthSalaryStartMonth, financialRecord.thirteenthSalaryInstallments)) {
      total += financialRecord.thirteenthSalaryFee;
    }

    if (monthIndex === 1 && financialRecord.adjustedCurrentYear && selectedYear === financialRecord.adjustmentYear) {
      total += financialRecord.retroactiveAmount;
    }

    return total;
  };

  const handleEditPayment = (monthIndex: number) => {
    const monthKey = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    const existingPayment = payments.find(p => p.paymentMonth === monthKey);
    const expectedAmount = getExpectedAmount(monthIndex);

    setPaymentForm({
      paid: existingPayment?.monthlyFeePaid || false,
      expectedAmount: expectedAmount,
      amountPaid: existingPayment?.amountPaid || expectedAmount,
      paymentDate: existingPayment?.paymentDate || new Date().toISOString().split('T')[0],
      paymentNotes: existingPayment?.paymentNotes || '',
    });
    setEditingMonth(monthIndex);
  };

  const handleSavePayment = async () => {
    if (editingMonth === null) return;

    const monthKey = `${selectedYear}-${String(editingMonth + 1).padStart(2, '0')}-01`;

    try {
      await recordMonthlyPayment(
        guest.id,
        monthKey,
        paymentForm.paid,
        paymentForm.expectedAmount,
        paymentForm.amountPaid,
        paymentForm.paymentDate,
        paymentForm.paymentNotes
      );
      setEditingMonth(null);
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Erro ao registrar pagamento');
    }
  };

  const getPaymentInfo = (monthIndex: number) => {
    const monthKey = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    return payments.find(p => p.paymentMonth === monthKey);
  };

  const totalOutstanding = financialRecord?.outstandingBalance || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Controle de Pagamentos</h2>
            <p className="text-sm text-gray-600 mt-1">{guest.fullName}</p>
            {totalOutstanding > 0 && (
              <p className="text-sm text-red-600 font-semibold mt-1 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                Saldo Devedor: R$ {totalOutstanding.toFixed(2)}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ano
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {months.map((month, index) => {
              const paymentInfo = getPaymentInfo(index);
              const expectedAmount = getExpectedAmount(index);
              const isPaid = paymentInfo?.monthlyFeePaid || false;
              const hasDifference = paymentInfo?.hasDifference || false;

              return (
                <div
                  key={index}
                  className={`border-2 rounded-lg p-4 transition-all ${
                    isPaid
                      ? hasDifference
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-green-400 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{month}</h3>
                    <div className={`p-2 rounded-full ${
                      isPaid
                        ? hasDifference
                          ? 'bg-yellow-200'
                          : 'bg-green-200'
                        : 'bg-gray-200'
                    }`}>
                      {isPaid ? (
                        hasDifference ? (
                          <AlertCircle className="text-yellow-700" size={20} />
                        ) : (
                          <Check className="text-green-700" size={20} />
                        )
                      ) : (
                        <X className="text-gray-600" size={20} />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Esperado:</span>
                      <span className="font-semibold">R$ {expectedAmount.toFixed(2)}</span>
                    </div>
                    {paymentInfo && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pago:</span>
                          <span className="font-semibold">R$ {(paymentInfo.amountPaid || 0).toFixed(2)}</span>
                        </div>
                        {hasDifference && (
                          <div className="flex justify-between text-red-600">
                            <span>Diferença:</span>
                            <span className="font-bold">R$ {paymentInfo.amountDifference.toFixed(2)}</span>
                          </div>
                        )}
                        {paymentInfo.paymentDate && (
                          <div className="flex items-center text-gray-600 text-xs">
                            <Calendar size={14} className="mr-1" />
                            {new Date(paymentInfo.paymentDate).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                        {paymentInfo.paymentNotes && (
                          <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded mt-2">
                            {paymentInfo.paymentNotes}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handleEditPayment(index)}
                    className="w-full py-2 px-4 bg-acasa-purple text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm"
                  >
                    {isPaid ? 'Editar' : 'Registrar'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {editingMonth !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Pagamento de {months[editingMonth]}
                </h3>
                <button onClick={() => setEditingMonth(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="paid"
                    checked={paymentForm.paid}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paid: e.target.checked })}
                    className="w-4 h-4 text-acasa-purple border-gray-300 rounded focus:ring-acasa-purple"
                  />
                  <label htmlFor="paid" className="ml-2 text-sm font-medium text-gray-700">
                    Pagamento Confirmado
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Esperado
                  </label>
                  <div className="flex items-center px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                    <DollarSign size={18} className="text-gray-500 mr-2" />
                    <span className="font-semibold">R$ {paymentForm.expectedAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Realmente Pago
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentForm.amountPaid}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {Math.abs(paymentForm.expectedAmount - paymentForm.amountPaid) > 0.01 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 font-semibold">
                      Diferença: R$ {(paymentForm.expectedAmount - paymentForm.amountPaid).toFixed(2)}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data do Pagamento
                  </label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={paymentForm.paymentNotes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentNotes: e.target.value })}
                    placeholder="Ex: Pagou parcial, faltou R$ 100,00 do reajuste..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setEditingMonth(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePayment}
                  className="px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-opacity-90"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
