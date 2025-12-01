import React, { useState } from 'react';
import { X, Copy, CheckCircle, AlertCircle, Clock, Calendar, DollarSign, User, FileText, Edit } from 'lucide-react';
import { LaborAgreementWithInstallments, LaborAgreementInstallment } from '../../types';
import { PaymentModal } from './PaymentModal';

interface LaborAgreementDetailsProps {
  agreement: LaborAgreementWithInstallments;
  onClose: () => void;
  onEdit: () => void;
}

export const LaborAgreementDetails: React.FC<LaborAgreementDetailsProps> = ({
  agreement,
  onClose,
  onEdit,
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<LaborAgreementInstallment | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(agreement.pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const handleMarkAsPaid = (installment: LaborAgreementInstallment) => {
    setSelectedInstallment(installment);
    setShowPaymentModal(true);
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

  const getInstallmentStatusBadge = (installment: LaborAgreementInstallment) => {
    if (installment.paymentStatus === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          Paga
        </span>
      );
    }

    if (installment.paymentStatus === 'overdue') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3" />
          Vencida
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3" />
        Pendente
      </span>
    );
  };

  const paidInstallments = agreement.installments.filter(i => i.paymentStatus === 'paid');
  const pendingInstallments = agreement.installments.filter(i => i.paymentStatus === 'pending');
  const overdueInstallments = agreement.installments.filter(i => i.paymentStatus === 'overdue');

  const totalPaid = paidInstallments.reduce((sum, i) => sum + i.amount, 0);
  const totalPending = [...pendingInstallments, ...overdueInstallments].reduce((sum, i) => sum + i.amount, 0);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl my-8">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Detalhes do Acordo</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar acordo"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Informações das Partes</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Reclamante vs Empresa</p>
                      <p className="text-base font-semibold text-gray-900">
                        {agreement.claimantName} <span className="text-gray-400 font-normal">vs</span> {agreement.companyName}
                      </p>
                    </div>

                    {agreement.processNumber && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Número do Processo</p>
                        <p className="text-base text-gray-900">{agreement.processNumber}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {agreement.laborCourt && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Vara Trabalhista</p>
                          <p className="text-base text-gray-900">{agreement.laborCourt}</p>
                        </div>
                      )}

                      {agreement.jurisdiction && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Comarca</p>
                          <p className="text-base text-gray-900">{agreement.jurisdiction}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Advogado Responsável</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Nome Completo</p>
                      <p className="text-base font-semibold text-gray-900">{agreement.lawyerFullName}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Chave PIX</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-white rounded border border-blue-200 text-sm font-mono text-gray-900">
                          {agreement.pixKey}
                        </code>
                        <button
                          onClick={handleCopyPix}
                          className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          title="Copiar chave PIX"
                        >
                          {copiedPix ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                      {copiedPix && (
                        <p className="text-xs text-green-600 mt-1">Chave PIX copiada!</p>
                      )}
                    </div>
                  </div>
                </div>

                {agreement.notes && (
                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Observações</h3>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{agreement.notes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Valor Total</p>
                    <DollarSign className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(agreement.totalAmount)}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Total Pago</p>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(totalPaid)}</p>
                  <p className="text-xs text-gray-600 mt-1">{paidInstallments.length} parcelas</p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Total Pendente</p>
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-orange-700">{formatCurrency(totalPending)}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {pendingInstallments.length + overdueInstallments.length} parcelas
                  </p>
                </div>

                {overdueInstallments.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <p className="text-sm font-semibold text-red-900">Parcelas Vencidas</p>
                    </div>
                    <p className="text-3xl font-bold text-red-700">{overdueInstallments.length}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  Timeline de Parcelas
                </h3>
                <p className="text-sm text-gray-600">
                  {paidInstallments.length} de {agreement.installments.length} pagas
                </p>
              </div>

              <div className="space-y-3">
                {agreement.installments
                  .sort((a, b) => a.installmentNumber - b.installmentNumber)
                  .map((installment) => (
                    <div
                      key={installment.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        installment.paymentStatus === 'paid'
                          ? 'bg-green-50 border-green-200'
                          : installment.paymentStatus === 'overdue'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                              installment.paymentStatus === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : installment.paymentStatus === 'overdue'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {installment.installmentNumber}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="text-lg font-bold text-gray-900">
                                {formatCurrency(installment.amount)}
                              </p>
                              {getInstallmentStatusBadge(installment)}
                            </div>

                            <div className="space-y-1">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Vencimento:</span> {formatDate(installment.dueDate)}
                              </p>

                              {installment.paymentDate && (
                                <p className="text-sm text-green-700">
                                  <span className="font-medium">Pago em:</span> {formatDate(installment.paymentDate)}
                                </p>
                              )}

                              {installment.paymentProof && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Comprovante:</span> {installment.paymentProof}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {installment.paymentStatus !== 'paid' && (
                          <button
                            onClick={() => handleMarkAsPaid(installment)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Marcar como Paga
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {showPaymentModal && selectedInstallment && (
        <PaymentModal
          installment={selectedInstallment}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInstallment(null);
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            setSelectedInstallment(null);
          }}
        />
      )}
    </>
  );
};
