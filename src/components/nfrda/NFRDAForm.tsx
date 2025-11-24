import React, { useState } from 'react';
import { Save, X, Upload } from 'lucide-react';
import { NFRDAEntry } from '../../types';
import { useNFRDA } from '../../contexts/NFRDAContext';
import { useEmployees } from '../../contexts/EmployeeContext';

interface NFRDAFormProps {
  entry?: NFRDAEntry;
  onClose: () => void;
  onSave: () => void;
}

export const NFRDAForm: React.FC<NFRDAFormProps> = ({ entry, onClose, onSave }) => {
  const { addEntry, updateEntry } = useNFRDA();
  const { employees } = useEmployees();
  const [isLoading, setIsLoading] = useState(false);

  // Filtrar colaboradores com contrato ou terceirizados
  const contractorsAndOutsourced = employees.filter(emp => 
    emp.employmentType === 'Contrato' || emp.employmentType === 'Terceirizado'
  );

  const [formData, setFormData] = useState<Omit<NFRDAEntry, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdate'>>({
    contractorId: entry?.contractorId || '',
    contractorName: entry?.contractorName || '',
    unit: entry?.unit || 'Botafogo',
    referenceMonth: entry?.referenceMonth || new Date().getMonth() + 1,
    referenceYear: entry?.referenceYear || new Date().getFullYear(),
    activityReportUpload: entry?.activityReportUpload || '',
    invoiceUpload: entry?.invoiceUpload || '',
    deliveryStatus: entry?.deliveryStatus || 'Aguardando NF/RDA',
    paymentStatus: entry?.paymentStatus || 'Não',
    paymentDate: entry?.paymentDate || '',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContractorChange = (contractorId: string) => {
    const selectedContractor = contractorsAndOutsourced.find(emp => emp.id === contractorId);
    if (selectedContractor) {
      setFormData(prev => ({
        ...prev,
        contractorId,
        contractorName: selectedContractor.fullName,
      }));
    }
  };

  const handleFileUpload = (field: 'activityReportUpload' | 'invoiceUpload') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Em uma implementação real, você faria upload para um servidor
      const fakeUrl = `https://example.com/nfrda/${field}/${file.name}`;
      handleInputChange(field, fakeUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (entry) {
        updateEntry(entry.id, formData);
      } else {
        addEntry(formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar entrada:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'Sim': return 'bg-green-100 text-green-700';
      case 'Aguardando NF/RDA': return 'bg-blue-100 text-blue-700';
      case 'Não': return 'bg-red-100 text-red-700';
      case 'Desconto': return 'bg-orange-100 text-orange-700';
      case 'Congelado': return 'bg-gray-100 text-gray-700';
      case 'Erro': return 'bg-red-100 text-red-700';
      case 'Sumiu': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Sim': return 'bg-green-100 text-green-700';
      case 'Não': return 'bg-red-100 text-red-700';
      case 'Parcial': return 'bg-yellow-100 text-yellow-700';
      case 'Congelado': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {entry ? 'Editar Entrada' : 'Nova Entrada NF + RDA'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Informações Básicas */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Informações Básicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Contratado *
                  </label>
                  <select
                    value={formData.contractorId}
                    onChange={(e) => handleContractorChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  >
                    <option value="">Selecione um contratado...</option>
                    {contractorsAndOutsourced.map(contractor => (
                      <option key={contractor.id} value={contractor.id}>
                        {contractor.fullName} ({contractor.employmentType} - {contractor.unit})
                      </option>
                    ))}
                  </select>
                  {contractorsAndOutsourced.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Nenhum colaborador com contrato ou terceirizado encontrado. Cadastre primeiro na seção Colaboradores.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidade *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  >
                    <option value="Botafogo">Botafogo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mês de Referência *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={formData.referenceMonth}
                      onChange={(e) => handleInputChange('referenceMonth', parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                      required
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>
                          {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][month - 1]}
                        </option>
                      ))}
                    </select>
                    <select
                      value={formData.referenceYear}
                      onChange={(e) => handleInputChange('referenceYear', parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                      required
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Uploads */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Documentos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relatório de Atividade (RDA)
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors">
                      <Upload size={16} className="mr-2" />
                      Upload RDA
                      <input
                        type="file"
                        onChange={handleFileUpload('activityReportUpload')}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                      />
                    </label>
                  </div>
                  {formData.activityReportUpload && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ RDA carregado: {formData.activityReportUpload.split('/').pop()}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nota Fiscal (NF)
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors">
                      <Upload size={16} className="mr-2" />
                      Upload NF
                      <input
                        type="file"
                        onChange={handleFileUpload('invoiceUpload')}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      />
                    </label>
                  </div>
                  {formData.invoiceUpload && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ NF carregada: {formData.invoiceUpload.split('/').pop()}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Status */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Status e Pagamento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status de Entrega *
                  </label>
                  <select
                    value={formData.deliveryStatus}
                    onChange={(e) => handleInputChange('deliveryStatus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  >
                    <option value="Aguardando NF/RDA">Aguardando NF/RDA</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                    <option value="Desconto">Desconto</option>
                    <option value="Congelado">Congelado</option>
                    <option value="Erro">Erro</option>
                    <option value="Sumiu">Sumiu</option>
                  </select>
                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDeliveryStatusColor(formData.deliveryStatus)}`}>
                      {formData.deliveryStatus}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pago? *
                  </label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  >
                    <option value="Não">Não</option>
                    <option value="Sim">Sim</option>
                    <option value="Parcial">Parcial</option>
                    <option value="Congelado">Congelado</option>
                  </select>
                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(formData.paymentStatus)}`}>
                      {formData.paymentStatus}
                    </span>
                  </div>
                </div>
                {(formData.paymentStatus === 'Sim' || formData.paymentStatus === 'Parcial') && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data do Pagamento
                    </label>
                    <input
                      type="date"
                      value={formData.paymentDate || ''}
                      onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Informações do Sistema */}
            {entry && (
              <section className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Informações do Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Última Atualização:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(entry.lastUpdate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Criado em:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(entry.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-600">ID da Entrada:</span>
                    <span className="ml-2 font-mono text-gray-900">#{entry.id}</span>
                  </div>
                </div>
              </section>
            )}
          </div>

          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center px-6 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save size={16} className="mr-2" />
              )}
              {entry ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};