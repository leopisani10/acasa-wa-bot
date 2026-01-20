import React, { useState } from 'react';
import { Save, X, Plus, Trash2, Upload } from 'lucide-react';
import { Guest, Vaccine } from '../../types';
import { useGuests } from '../../contexts/GuestContext';

interface GuestFormProps {
  guest?: Guest;
  onClose: () => void;
  onSave: () => void;
}

export const GuestForm: React.FC<GuestFormProps> = ({ guest, onClose, onSave }) => {
  const { addGuest, updateGuest } = useGuests();
  const [isLoading, setIsLoading] = useState(false);

  const [hasFinancialResponsible, setHasFinancialResponsible] = useState(
    !!(guest?.financialResponsibleName || guest?.financialResponsibleCpf)
  );

  const [formData, setFormData] = useState<Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>>({
    // Informações Pessoais
    fullName: guest?.fullName || '',
    gender: guest?.gender || 'Masculino',
    birthDate: guest?.birthDate || '',
    cpf: guest?.cpf || '',
    rg: guest?.rg || '',
    documentIssuer: guest?.documentIssuer || '',
    photo: guest?.photo || '',
    hasCuratorship: guest?.hasCuratorship || false,
    imageUsageAuthorized: guest?.imageUsageAuthorized || false,

    // Contato
    phone: guest?.phone || '',
    email: guest?.email || '',
    address: guest?.address || '',
    neighborhood: guest?.neighborhood || '',
    zipCode: guest?.zipCode || '',

    // Contratuais
    status: guest?.status || 'Ativo',
    stayType: guest?.stayType || 'Longa Permanência',
    admissionDate: guest?.admissionDate || '',
    exitDate: guest?.exitDate || '',
    exitReason: guest?.exitReason || undefined,
    hasNewContract: guest?.hasNewContract || false,
    contractExpiryDate: guest?.contractExpiryDate || '',
    dependencyLevel: guest?.dependencyLevel || 'I',
    legalResponsibleRelationship: guest?.legalResponsibleRelationship || '',
    legalResponsibleCpf: guest?.legalResponsibleCpf || '',

    // Responsável Financeiro
    financialResponsibleName: guest?.financialResponsibleName || '',
    financialResponsibleRg: guest?.financialResponsibleRg || '',
    financialResponsibleCpf: guest?.financialResponsibleCpf || '',
    financialResponsibleMaritalStatus: guest?.financialResponsibleMaritalStatus || 'Solteiro(a)',
    financialResponsiblePhone: guest?.financialResponsiblePhone || '',
    financialResponsibleEmail: guest?.financialResponsibleEmail || '',
    financialResponsibleAddress: guest?.financialResponsibleAddress || '',
    financialResponsibleProfession: guest?.financialResponsibleProfession || '',
    unit: guest?.unit || 'Botafogo',

    // Taxas
    climatizationFee: guest?.climatizationFee || false,
    maintenanceFee: guest?.maintenanceFee || false,
    trousseauFee: guest?.trousseauFee || false,
    administrativeFee: guest?.administrativeFee || false,

    // Acomodação
    roomNumber: guest?.roomNumber || '',

    // Saúde
    healthPlan: guest?.healthPlan || '',
    hasSpeechTherapy: guest?.hasSpeechTherapy || false,
    pia: guest?.pia || '',
    paisi: guest?.paisi || '',
    digitalizedContract: guest?.digitalizedContract || '',

    // Vacinas
    vaccinationUpToDate: guest?.vaccinationUpToDate || false,
    vaccines: guest?.vaccines || [],
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Clear exit fields when status changes to 'Ativo'
      if (field === 'status' && value === 'Ativo') {
        newData.exitReason = undefined;
        newData.exitDate = '';
      }
      
      return newData;
    });
  };

  const addVaccine = () => {
    const newVaccine: Vaccine = {
      id: Date.now().toString(),
      type: 'COVID-19',
      applicationDate: '',
      notes: '',
    };
    setFormData(prev => ({
      ...prev,
      vaccines: [...prev.vaccines, newVaccine],
    }));
  };

  const updateVaccine = (vaccineId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      vaccines: prev.vaccines.map(vaccine =>
        vaccine.id === vaccineId ? { ...vaccine, [field]: value } : vaccine
      ),
    }));
  };

  const removeVaccine = (vaccineId: string) => {
    setFormData(prev => ({
      ...prev,
      vaccines: prev.vaccines.filter(vaccine => vaccine.id !== vaccineId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepare data, clear financial responsible if not needed
      const dataToSave = hasFinancialResponsible
        ? formData
        : {
            ...formData,
            financialResponsibleName: '',
            financialResponsibleRg: '',
            financialResponsibleCpf: '',
            financialResponsibleMaritalStatus: 'Solteiro(a)',
            financialResponsiblePhone: '',
            financialResponsibleEmail: '',
            financialResponsibleAddress: '',
            financialResponsibleProfession: '',
          };

      if (guest) {
        await updateGuest(guest.id, dataToSave);
      } else {
        await addGuest(dataToSave);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar hóspede:', error);
      alert(`Erro ao salvar hóspede: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden font-sans">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 font-sans">
            {guest ? 'Editar Hóspede' : 'Novo Hóspede'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors font-sans"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-8">
            {/* Informações Pessoais */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 font-sans">
                Informações Pessoais e Identificação
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sexo
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RG
                  </label>
                  <input
                    type="text"
                    value={formData.rg}
                    onChange={(e) => handleInputChange('rg', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Órgão Emissor
                  </label>
                  <input
                    type="text"
                    value={formData.documentIssuer}
                    onChange={(e) => handleInputChange('documentIssuer', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: SSP/RJ"
                  />
                </div>
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hasCuratorship"
                      checked={formData.hasCuratorship}
                      onChange={(e) => handleInputChange('hasCuratorship', e.target.checked)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasCuratorship" className="text-sm font-medium text-gray-700">
                      Possui Curatela
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="imageUsageAuthorized"
                      checked={formData.imageUsageAuthorized}
                      onChange={(e) => handleInputChange('imageUsageAuthorized', e.target.checked)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="imageUsageAuthorized" className="text-sm font-medium text-gray-700">
                      Uso de Imagem Autorizado
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* Informações Contratuais */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Informações Contratuais e Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Permanência
                  </label>
                  <select
                    value={formData.stayType}
                    onChange={(e) => handleInputChange('stayType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Longa Permanência">Longa Permanência</option>
                    <option value="Centro Dia">Centro Dia</option>
                  </select>
                </div>
                {formData.status === 'Inativo' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motivo da Inativação
                      </label>
                      <select
                        value={formData.exitReason || ''}
                        onChange={(e) => handleInputChange('exitReason', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Selecione o motivo...</option>
                        <option value="Óbito">Óbito</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data do Último Dia na Instituição
                      </label>
                      <input
                        type="date"
                        value={formData.exitDate || ''}
                        onChange={(e) => handleInputChange('exitDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Admissão
                  </label>
                  <input
                    type="date"
                    value={formData.admissionDate}
                    onChange={(e) => handleInputChange('admissionDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidade
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Botafogo">Botafogo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grau de Dependência
                  </label>
                  <select
                    value={formData.dependencyLevel}
                    onChange={(e) => handleInputChange('dependencyLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="I">Grau I</option>
                    <option value="II">Grau II</option>
                    <option value="III">Grau III</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Vencimento Contrato
                  </label>
                  <input
                    type="date"
                    value={formData.contractExpiryDate}
                    onChange={(e) => handleInputChange('contractExpiryDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número do Quarto
                  </label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parentesco do Responsável
                  </label>
                  <input
                    type="text"
                    value={formData.legalResponsibleRelationship}
                    onChange={(e) => handleInputChange('legalResponsibleRelationship', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Filho(a), Cônjuge"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF do Responsável
                  </label>
                  <input
                    type="text"
                    value={formData.legalResponsibleCpf}
                    onChange={(e) => handleInputChange('legalResponsibleCpf', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hasNewContract"
                    checked={formData.hasNewContract}
                    onChange={(e) => handleInputChange('hasNewContract', e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasNewContract" className="text-sm font-medium text-gray-700">
                    Possui Contrato Novo
                  </label>
                </div>
              </div>
            </section>

            {/* Informações do Responsável Financeiro */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Dados do Responsável Financeiro
              </h3>

              <div className="mb-4 flex items-center bg-gray-50 p-4 rounded-lg">
                <input
                  type="checkbox"
                  id="hasFinancialResponsible"
                  checked={hasFinancialResponsible}
                  onChange={(e) => setHasFinancialResponsible(e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="hasFinancialResponsible" className="text-sm font-medium text-gray-700">
                  Possui Responsável Financeiro
                </label>
              </div>

              {hasFinancialResponsible && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo do Responsável
                    </label>
                    <input
                      type="text"
                      value={formData.financialResponsibleName}
                      onChange={(e) => handleInputChange('financialResponsibleName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado Civil
                    </label>
                    <select
                      value={formData.financialResponsibleMaritalStatus}
                      onChange={(e) => handleInputChange('financialResponsibleMaritalStatus', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                      <option value="União Estável">União Estável</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RG
                    </label>
                    <input
                      type="text"
                      value={formData.financialResponsibleRg}
                      onChange={(e) => handleInputChange('financialResponsibleRg', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CPF
                    </label>
                    <input
                      type="text"
                      value={formData.financialResponsibleCpf}
                      onChange={(e) => handleInputChange('financialResponsibleCpf', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profissão
                    </label>
                    <input
                      type="text"
                      value={formData.financialResponsibleProfession}
                      onChange={(e) => handleInputChange('financialResponsibleProfession', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Engenheiro, Aposentado"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={formData.financialResponsiblePhone}
                      onChange={(e) => handleInputChange('financialResponsiblePhone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(21) 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.financialResponsibleEmail}
                      onChange={(e) => handleInputChange('financialResponsibleEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Endereço Completo
                    </label>
                    <input
                      type="text"
                      value={formData.financialResponsibleAddress}
                      onChange={(e) => handleInputChange('financialResponsibleAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Rua, número, bairro, cidade, CEP"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Taxas */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Possuem?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="climatizationFee"
                    checked={formData.climatizationFee}
                    onChange={(e) => handleInputChange('climatizationFee', e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="climatizationFee" className="text-sm font-medium text-gray-700">
                    Taxa de Climatização (Janeiro, Fevereiro e Março)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="maintenanceFee"
                    checked={formData.maintenanceFee}
                    onChange={(e) => handleInputChange('maintenanceFee', e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="maintenanceFee" className="text-sm font-medium text-gray-700">
                    Taxa de Manutenção (Agosto)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="trousseauFee"
                    checked={formData.trousseauFee}
                    onChange={(e) => handleInputChange('trousseauFee', e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="trousseauFee" className="text-sm font-medium text-gray-700">
                    Taxa de Enxoval (Julho e Setembro)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="administrativeFee"
                    checked={formData.administrativeFee}
                    onChange={(e) => handleInputChange('administrativeFee', e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="administrativeFee" className="text-sm font-medium text-gray-700">
                    Taxa Administrativa (Agosto e Novembro)
                  </label>
                </div>
              </div>
            </section>


            {/* Plano de Saúde */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Plano de Saúde e Serviços de Saúde
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plano de Saúde
                  </label>
                  <input
                    type="text"
                    value={formData.healthPlan}
                    onChange={(e) => handleInputChange('healthPlan', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Unimed, SulAmérica"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hasSpeechTherapy"
                    checked={formData.hasSpeechTherapy}
                    onChange={(e) => handleInputChange('hasSpeechTherapy', e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasSpeechTherapy" className="text-sm font-medium text-gray-700">
                    Possui Fonoaudiologia
                  </label>
                </div>
              </div>
              
              <h4 className="text-md font-semibold text-gray-900 mb-4">Contrato Digitalizado</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contrato Digitalizado
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors">
                      <Upload size={16} className="mr-2" />
                      Anexar Contrato
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const fakeUrl = `https://example.com/contracts/${file.name}`;
                            handleInputChange('digitalizedContract', fakeUrl);
                          }
                        }}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </label>
                  </div>
                  {formData.digitalizedContract && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Contrato anexado: {formData.digitalizedContract.split('/').pop()}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Vacinas */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Vacinas
              </h3>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="vaccinationUpToDate"
                      checked={formData.vaccinationUpToDate}
                      onChange={(e) => handleInputChange('vaccinationUpToDate', e.target.checked)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="vaccinationUpToDate" className="text-sm font-medium text-gray-700">
                      Vacinação em Dia
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={addVaccine}
                    className="flex items-center px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Plus size={16} className="mr-1" />
                    Adicionar Vacina
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.vaccines.map((vaccine) => (
                    <div key={vaccine.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <select
                        value={vaccine.type}
                        onChange={(e) => updateVaccine(vaccine.id, 'type', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="COVID-19">COVID-19</option>
                        <option value="Influenza">Influenza</option>
                        <option value="Hepatite B">Hepatite B</option>
                        <option value="Pneumonia">Pneumonia</option>
                        <option value="Outras">Outras</option>
                      </select>
                      <input
                        type="date"
                        value={vaccine.applicationDate}
                        onChange={(e) => updateVaccine(vaccine.id, 'applicationDate', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={vaccine.notes || ''}
                        onChange={(e) => updateVaccine(vaccine.id, 'notes', e.target.value)}
                        placeholder="Observações"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => removeVaccine(vaccine.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
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
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save size={16} className="mr-2" />
              )}
              {guest ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};