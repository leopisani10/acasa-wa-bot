import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, User, Briefcase, DollarSign, FileText, Check, Calendar } from 'lucide-react';
import { useLaborAgreements } from '../../contexts/LaborAgreementContext';
import { LaborAgreementWithInstallments } from '../../types';

interface LaborAgreementFormProps {
  agreement?: LaborAgreementWithInstallments;
  onClose: () => void;
  onSave: () => void;
}

export const LaborAgreementForm: React.FC<LaborAgreementFormProps> = ({ agreement, onClose, onSave }) => {
  const { addAgreement, updateAgreement } = useLaborAgreements();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [claimantName, setClaimantName] = useState(agreement?.claimantName || '');
  const [companyName, setCompanyName] = useState(agreement?.companyName || '');
  const [processNumber, setProcessNumber] = useState(agreement?.processNumber || '');
  const [laborCourt, setLaborCourt] = useState(agreement?.laborCourt || '');
  const [jurisdiction, setJurisdiction] = useState(agreement?.jurisdiction || '');

  const [lawyerFullName, setLawyerFullName] = useState(agreement?.lawyerFullName || '');
  const [pixKey, setPixKey] = useState(agreement?.pixKey || '');

  const [totalAmount, setTotalAmount] = useState(agreement?.totalAmount?.toString() || '');
  const [installmentCount, setInstallmentCount] = useState(agreement?.installmentCount?.toString() || '1');
  const [firstDueDate, setFirstDueDate] = useState('');
  const [divisionType, setDivisionType] = useState<'equal' | 'custom'>('equal');
  const [customAmounts, setCustomAmounts] = useState<string[]>([]);

  const [notes, setNotes] = useState(agreement?.notes || '');

  const isEditMode = !!agreement;

  const totalSteps = isEditMode ? 2 : 4;

  useEffect(() => {
    if (divisionType === 'custom' && installmentCount) {
      const count = parseInt(installmentCount);
      if (!isNaN(count) && count > 0) {
        const amounts = Array(count).fill('');
        setCustomAmounts(amounts);
      }
    }
  }, [divisionType, installmentCount]);

  const handleCustomAmountChange = (index: number, value: string) => {
    const newAmounts = [...customAmounts];
    newAmounts[index] = value;
    setCustomAmounts(newAmounts);
  };

  const calculateInstallments = () => {
    const count = parseInt(installmentCount);
    const total = parseFloat(totalAmount);

    if (isNaN(count) || isNaN(total) || count <= 0 || total <= 0) return [];

    const installments = [];
    const startDate = new Date(firstDueDate + 'T00:00:00');

    if (divisionType === 'equal') {
      const amountPerInstallment = total / count;

      for (let i = 0; i < count; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        installments.push({
          installmentNumber: i + 1,
          amount: amountPerInstallment,
          dueDate: dueDate.toISOString().split('T')[0],
          paymentStatus: 'pending' as const,
        });
      }
    } else {
      for (let i = 0; i < count; i++) {
        const amount = parseFloat(customAmounts[i] || '0');
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        installments.push({
          installmentNumber: i + 1,
          amount: amount,
          dueDate: dueDate.toISOString().split('T')[0],
          paymentStatus: 'pending' as const,
        });
      }
    }

    return installments;
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(claimantName.trim() && companyName.trim());
      case 2:
        return !!(lawyerFullName.trim() && pixKey.trim());
      case 3:
        if (!totalAmount || !installmentCount || !firstDueDate) return false;
        const total = parseFloat(totalAmount);
        const count = parseInt(installmentCount);
        if (isNaN(total) || isNaN(count) || total <= 0 || count <= 0) return false;

        if (divisionType === 'custom') {
          const customSum = customAmounts.reduce((sum, val) => sum + parseFloat(val || '0'), 0);
          return Math.abs(customSum - total) < 0.01;
        }
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode) {
        await updateAgreement(agreement.id, {
          claimantName,
          companyName,
          lawyerFullName,
          pixKey,
          processNumber: processNumber || undefined,
          laborCourt: laborCourt || undefined,
          jurisdiction: jurisdiction || undefined,
          notes: notes || undefined,
        });
      } else {
        const installments = calculateInstallments();

        await addAgreement(
          {
            claimantName,
            companyName,
            lawyerFullName,
            pixKey,
            processNumber: processNumber || undefined,
            laborCourt: laborCourt || undefined,
            jurisdiction: jurisdiction || undefined,
            totalAmount: parseFloat(totalAmount),
            installmentCount: parseInt(installmentCount),
            notes: notes || undefined,
          },
          installments
        );
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving agreement:', error);
      alert('Erro ao salvar acordo');
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

  const renderStepIndicator = () => {
    const steps = isEditMode
      ? [
          { number: 1, label: 'Dados das Partes', icon: User },
          { number: 2, label: 'Revisão', icon: Check },
        ]
      : [
          { number: 1, label: 'Dados das Partes', icon: User },
          { number: 2, label: 'Advogado', icon: Briefcase },
          { number: 3, label: 'Parcelas', icon: DollarSign },
          { number: 4, label: 'Revisão', icon: Check },
        ];

    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                  currentStep >= step.number
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                <step.icon className="w-6 h-6" />
              </div>
              <span className={`mt-2 text-xs font-medium ${currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações das Partes</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome do Reclamante *
        </label>
        <input
          type="text"
          value={claimantName}
          onChange={(e) => setClaimantName(e.target.value)}
          required
          placeholder="Nome completo do reclamante"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome da Empresa *
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
          placeholder="Nome da empresa reclamada"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Número do Processo
        </label>
        <input
          type="text"
          value={processNumber}
          onChange={(e) => setProcessNumber(e.target.value)}
          placeholder="Ex: 0000000-00.0000.0.00.0000"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vara Trabalhista
          </label>
          <input
            type="text"
            value={laborCourt}
            onChange={(e) => setLaborCourt(e.target.value)}
            placeholder="Ex: 1ª Vara do Trabalho"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comarca
          </label>
          <input
            type="text"
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            placeholder="Ex: Rio de Janeiro"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    if (isEditMode) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Advogado</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo do Advogado *
            </label>
            <input
              type="text"
              value={lawyerFullName}
              onChange={(e) => setLawyerFullName(e.target.value)}
              required
              placeholder="Nome completo do advogado responsável"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chave PIX *
            </label>
            <input
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              required
              placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Informe a chave PIX para pagamento ao advogado
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Observações gerais sobre o acordo..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Advogado</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome Completo do Advogado *
          </label>
          <input
            type="text"
            value={lawyerFullName}
            onChange={(e) => setLawyerFullName(e.target.value)}
            required
            placeholder="Nome completo do advogado responsável"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chave PIX *
          </label>
          <input
            type="text"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            required
            placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            Informe a chave PIX para pagamento ao advogado
          </p>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuração das Parcelas</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor Total do Acordo *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            required
            placeholder="0,00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantidade de Parcelas *
          </label>
          <input
            type="number"
            min="1"
            value={installmentCount}
            onChange={(e) => setInstallmentCount(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="w-4 h-4 inline mr-1" />
          Data de Vencimento da 1ª Parcela *
        </label>
        <input
          type="date"
          value={firstDueDate}
          onChange={(e) => setFirstDueDate(e.target.value)}
          required
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">
          As demais parcelas vencerão mensalmente a partir desta data
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Divisão
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="equal"
              checked={divisionType === 'equal'}
              onChange={(e) => setDivisionType(e.target.value as 'equal' | 'custom')}
              className="mr-2"
            />
            <span className="text-sm">Dividir valor igualmente entre as parcelas</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="custom"
              checked={divisionType === 'custom'}
              onChange={(e) => setDivisionType(e.target.value as 'equal' | 'custom')}
              className="mr-2"
            />
            <span className="text-sm">Definir valor de cada parcela individualmente</span>
          </label>
        </div>
      </div>

      {divisionType === 'custom' && customAmounts.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Valores Individuais</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
            {customAmounts.map((amount, index) => (
              <div key={index}>
                <label className="block text-xs text-gray-600 mb-1">Parcela {index + 1}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => handleCustomAmountChange(index, e.target.value)}
                  required
                  placeholder="0,00"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}
          </div>
          {divisionType === 'custom' && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Soma das parcelas:</span>
                <span className="font-semibold">
                  {formatCurrency(customAmounts.reduce((sum, val) => sum + parseFloat(val || '0'), 0))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Valor total:</span>
                <span className="font-semibold">{formatCurrency(parseFloat(totalAmount || '0'))}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {divisionType === 'equal' && totalAmount && installmentCount && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700">
            Cada parcela terá o valor de{' '}
            <span className="font-bold text-blue-900">
              {formatCurrency(parseFloat(totalAmount) / parseInt(installmentCount))}
            </span>
          </p>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => {
    const installments = calculateInstallments();

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revisão e Confirmação</h3>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Partes</h4>
            <p className="text-sm text-gray-900">
              <span className="font-medium">{claimantName}</span> vs <span className="font-medium">{companyName}</span>
            </p>
            {processNumber && (
              <p className="text-xs text-gray-600 mt-1">Processo: {processNumber}</p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Advogado</h4>
            <p className="text-sm text-gray-900">{lawyerFullName}</p>
            <p className="text-xs text-gray-600 mt-1">PIX: {pixKey}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Resumo Financeiro</h4>
            <div className="space-y-1">
              <p className="text-sm text-gray-900">
                Valor Total: <span className="font-bold">{formatCurrency(parseFloat(totalAmount))}</span>
              </p>
              <p className="text-sm text-gray-900">
                Parcelas: <span className="font-bold">{installmentCount}x</span>
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Timeline de Parcelas</h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {installments.map((inst) => (
              <div key={inst.installmentNumber} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                    {inst.installmentNumber}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(inst.amount)}</p>
                    <p className="text-xs text-gray-500">Vencimento: {formatDate(inst.dueDate)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observações
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Observações gerais sobre o acordo..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Editar Acordo Trabalhista' : 'Novo Acordo Trabalhista'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {!isEditMode && renderStepIndicator()}

          <div className="min-h-[400px]">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && !isEditMode && renderStep3()}
            {currentStep === 4 && !isEditMode && renderStep4()}
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-6">
            <div>
              {currentStep > 1 && !isEditMode && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Voltar
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>

              {(currentStep === totalSteps || isEditMode) ? (
                <button
                  type="submit"
                  disabled={loading || !validateStep(currentStep)}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      {isEditMode ? 'Salvar Alterações' : 'Criar Acordo'}
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!validateStep(currentStep)}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
