import React, { useState } from 'react';
import { Check, X, Calendar } from 'lucide-react';
import { useFinancial } from '../../contexts/FinancialContext';
import { Guest } from '../../types';

interface MonthlyPaymentTrackerProps {
  guest: Guest;
  onClose: () => void;
}

export const MonthlyPaymentTracker: React.FC<MonthlyPaymentTrackerProps> = ({ guest, onClose }) => {
  const { recordMonthlyPayment, getMonthlyPayments } = useFinancial();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const payments = getMonthlyPayments(guest.id);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handleTogglePayment = async (monthIndex: number) => {
    const monthKey = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    const existingPayment = payments.find(p => p.paymentMonth === monthKey);
    const newStatus = !existingPayment?.monthlyFeePaid;

    try {
      await recordMonthlyPayment(
        guest.id,
        monthKey,
        newStatus,
        newStatus ? new Date().toISOString().split('T')[0] : undefined
      );
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Erro ao registrar pagamento');
    }
  };

  const isPaymentConfirmed = (monthIndex: number): boolean => {
    const monthKey = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    const payment = payments.find(p => p.paymentMonth === monthKey);
    return payment?.monthlyFeePaid || false;
  };

  const getPaymentDate = (monthIndex: number): string | undefined => {
    const monthKey = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    const payment = payments.find(p => p.paymentMonth === monthKey);
    return payment?.paymentDate;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Controle de Pagamentos</h2>
            <p className="text-sm text-gray-600 mt-1">{guest.fullName}</p>
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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {months.map((month, index) => {
              const isPaid = isPaymentConfirmed(index);
              const paymentDate = getPaymentDate(index);

              return (
                <button
                  key={month}
                  onClick={() => handleTogglePayment(index)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isPaid
                      ? 'bg-green-50 border-green-500 hover:bg-green-100'
                      : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{month}</span>
                    {isPaid ? (
                      <Check className="text-green-600" size={20} />
                    ) : (
                      <X className="text-gray-400" size={20} />
                    )}
                  </div>
                  {isPaid && paymentDate && (
                    <div className="flex items-center text-xs text-gray-600">
                      <Calendar size={12} className="mr-1" />
                      {new Date(paymentDate).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  <p className="text-xs text-gray-600 mt-2">
                    {isPaid ? 'Pago' : 'Não Pago'}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              <strong>Instruções:</strong> Clique em um mês para marcar/desmarcar o pagamento da mensalidade.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
