import React, { useState } from 'react';
import { X, CheckCircle, Calendar, FileText } from 'lucide-react';
import { LaborAgreementInstallment } from '../../types';
import { useLaborAgreements } from '../../contexts/LaborAgreementContext';

interface PaymentModalProps {
  installment: LaborAgreementInstallment;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ installment, onClose, onSuccess }) => {
  const { markInstallmentAsPaid } = useLaborAgreements();
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentProof, setPaymentProof] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await markInstallmentAsPaid(installment.id, paymentDate, paymentProof || undefined);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error marking installment as paid:', error);
      alert('Erro ao marcar parcela como paga');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Confirmar Pagamento
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Parcela:</span>
                <span className="text-sm font-semibold text-gray-900">
                  #{installment.installmentNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Valor:</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(installment.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Vencimento Original:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatDate(installment.dueDate)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Data do Pagamento *
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Comprovante / Observações
            </label>
            <textarea
              value={paymentProof}
              onChange={(e) => setPaymentProof(e.target.value)}
              rows={3}
              placeholder="Número do comprovante, observações sobre o pagamento..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Opcional - adicione informações sobre o comprovante de pagamento
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Confirmar Pagamento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
