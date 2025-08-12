import React, { useState } from 'react';
import { Save, X, Plus, Trash2, Upload } from 'lucide-react';
import { Employee, CovidVaccine, MedicalExam, GeneralVaccine, Vacation } from '../../types';
import { useEmployees } from '../../contexts/EmployeeContext';

interface EmployeeFormProps {
  employee?: Employee;
  onClose: () => void;
  onSave: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onClose, onSave }) => {
  const { addEmployee, updateEmployee } = useEmployees();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>({
    // Campos sempre visíveis
    fullName: employee?.fullName || '',
    cpf: employee?.cpf || '',
    rg: employee?.rg || '',
    birthDate: employee?.birthDate || '',
    address: employee?.address || '',
    position: employee?.position || '',
    unit: employee?.unit || 'Botafogo I',
    status: employee?.status || 'Ativo',
    photo: employee?.photo || '',
    covidVaccines: employee?.covidVaccines || [],
    observations: employee?.observations || '',
    professionalLicense: employee?.professionalLicense || {
      council: 'Não Possui',
      licenseNumber: '',
      expiryDate: '',
    },
    
    // Campos de saída
    exitDate: employee?.exitDate || '',
    exitReason: employee?.exitReason || undefined,
    
    // Tipo de vínculo
    employmentType: employee?.employmentType || 'CLT',
    
    // Dados específicos por tipo
    cltData: employee?.cltData || {
      ctps: '',
      ctpsSeries: '',
      pis: '',
      voterTitle: '',
      voterZone: '',
      voterSection: '',
      medicalExams: [],
      generalVaccines: [],
      vacations: [],
      inssDocument: '',
      contractAmendment: '',
      uniformSize: {
        shirt: 'M',
        pants: '',
        shoes: '',
        coat: 'M',
      },
    },
    contractData: employee?.contractData || {
      signedContract: '',
      contractStartDate: '',
      contractEndDate: '',
      bankData: {
        bank: '',
        agency: '',
        account: '',
        accountType: 'Corrente',
        pix: '',
      },
      profession: '',
      phone: '',
      email: '',
    },
    outsourcedData: employee?.outsourcedData || {
      companyName: '',
      companyCnpj: '',
      directSupervisor: '',
      serviceType: '',
      contractStartDate: '',
      contractEndDate: '',
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Clear exit fields when status changes to active
      if (field === 'status' && value !== 'Inativo') {
        newData.exitDate = '';
        newData.exitReason = undefined;
      }
      
      return newData;
    });
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const handleDeepNestedInputChange = (parent: string, nested: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [nested]: {
          ...(prev[parent as keyof typeof prev] as any)?.[nested],
          [field]: value,
        },
      },
    }));
  };

  // Funções para COVID vaccines
  const addCovidVaccine = () => {
    const newVaccine: CovidVaccine = {
      id: Date.now().toString(),
      dose: '1ª Dose',
      vaccineType: 'Pfizer',
      applicationDate: '',
      expiryDate: '',
      notes: '',
    };
    setFormData(prev => ({
      ...prev,
      covidVaccines: [...prev.covidVaccines, newVaccine],
    }));
  };

  const updateCovidVaccine = (vaccineId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      covidVaccines: prev.covidVaccines.map(vaccine =>
        vaccine.id === vaccineId ? { ...vaccine, [field]: value } : vaccine
      ),
    }));
  };

  const removeCovidVaccine = (vaccineId: string) => {
    setFormData(prev => ({
      ...prev,
      covidVaccines: prev.covidVaccines.filter(vaccine => vaccine.id !== vaccineId),
    }));
  };

  // Funções para exames médicos (CLT)
  const addMedicalExam = () => {
    const newExam: MedicalExam = {
      id: Date.now().toString(),
      type: 'ASO',
      examDate: '',
      expiryDate: '',
      result: 'Apto',
      notes: '',
      attachment: '',
    };
    setFormData(prev => ({
      ...prev,
      cltData: {
        ...prev.cltData!,
        medicalExams: [...prev.cltData!.medicalExams, newExam],
      },
    }));
  };

  const updateMedicalExam = (examId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      cltData: {
        ...prev.cltData!,
        medicalExams: prev.cltData!.medicalExams.map(exam =>
          exam.id === examId ? { ...exam, [field]: value } : exam
        ),
      },
    }));
  };

  const removeMedicalExam = (examId: string) => {
    setFormData(prev => ({
      ...prev,
      cltData: {
        ...prev.cltData!,
        medicalExams: prev.cltData!.medicalExams.filter(exam => exam.id !== examId),
      },
    }));
  };

  // Funções para vacinas gerais (CLT)
  const addGeneralVaccine = () => {
    const newVaccine: GeneralVaccine = {
      id: Date.now().toString(),
      type: 'Hepatite B',
      applicationDate: '',
      expiryDate: '',
      notes: '',
    };
    setFormData(prev => ({
      ...prev,
      cltData: {
        ...prev.cltData!,
        generalVaccines: [...prev.cltData!.generalVaccines, newVaccine],
      },
    }));
  };

  const updateGeneralVaccine = (vaccineId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      cltData: {
        ...prev.cltData!,
        generalVaccines: prev.cltData!.generalVaccines.map(vaccine =>
          vaccine.id === vaccineId ? { ...vaccine, [field]: value } : vaccine
        ),
      },
    }));
  };

  const removeGeneralVaccine = (vaccineId: string) => {
    setFormData(prev => ({
      ...prev,
      cltData: {
        ...prev.cltData!,
        generalVaccines: prev.cltData!.generalVaccines.filter(vaccine => vaccine.id !== vaccineId),
      },
    }));
  };

  // Funções para férias (CLT)
  const addVacation = () => {
    const newVacation: Vacation = {
      id: Date.now().toString(),
      startDate: '',
      endDate: '',
      days: 30,
      period: new Date().getFullYear().toString(),
      status: 'Programadas',
    };
    setFormData(prev => ({
      ...prev,
      cltData: {
        ...prev.cltData!,
        vacations: [...prev.cltData!.vacations, newVacation],
      },
    }));
  };

  const updateVacation = (vacationId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      cltData: {
        ...prev.cltData!,
        vacations: prev.cltData!.vacations.map(vacation =>
          vacation.id === vacationId ? { ...vacation, [field]: value } : vacation
        ),
      },
    }));
  };

  const removeVacation = (vacationId: string) => {
    setFormData(prev => ({
      ...prev,
      cltData: {
        ...prev.cltData!,
        vacations: prev.cltData!.vacations.filter(vacation => vacation.id !== vacationId),
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (employee) {
        updateEmployee(employee.id, formData);
      } else {
        addEmployee(formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar colaborador:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {employee ? 'Editar Colaborador' : 'Novo Colaborador'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-140px)]">
          <div className="p-6 space-y-8">
            {/* Informações Básicas */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Informações Básicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Vínculo *
                  </label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => handleInputChange('employmentType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  >
                    <option value="CLT">CLT</option>
                    <option value="Contrato">Contrato</option>
                    <option value="Terceirizado">Terceirizado</option>
                    <option value="Estágio">Estágio</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF *
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    placeholder="000.000.000-00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RG *
                  </label>
                  <input
                    type="text"
                    value={formData.rg}
                    onChange={(e) => handleInputChange('rg', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo *
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  >
                    <option value="">Selecione o cargo...</option>
                    <option value="Enfermeira">Enfermeira</option>
                    <option value="Médico">Médico</option>
                    <option value="Técnico de Enfermagem">Técnico de Enfermagem</option>
                    <option value="Cuidador de Idosos">Cuidador de Idosos</option>
                    <option value="Auxiliar de Serviços Gerais">Auxiliar de Serviços Gerais</option>
                    <option value="Cozinheira">Cozinheira</option>
                    <option value="Nutricionista">Nutricionista</option>
                    <option value="Fisioterapeuta">Fisioterapeuta</option>
                    <option value="Assistente social">Assistente social</option>
                    <option value="Professora de Yoga">Professora de Yoga</option>
                    <option value="Psicóloga">Psicóloga</option>
                  </select>
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
                    <option value="Tijuca">Tijuca</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Afastado">Afastado</option>
                    <option value="Férias">Férias</option>
                  </select>
                </div>
                {formData.status === 'Inativo' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Saída *
                      </label>
                      <input
                        type="date"
                        value={formData.exitDate || ''}
                        onChange={(e) => handleInputChange('exitDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motivo da Saída *
                      </label>
                      <select
                        value={formData.exitReason || ''}
                        onChange={(e) => handleInputChange('exitReason', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                        required
                      >
                        <option value="">Selecione o motivo...</option>
                        <option value="Rescisão">Rescisão</option>
                        <option value="Demissão">Demissão</option>
                        <option value="Pedido de Demissão">Pedido de Demissão</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Carteira Profissional */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Carteira Profissional
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conselho
                  </label>
                  <select
                    value={formData.professionalLicense?.council || 'Não Possui'}
                    onChange={(e) => handleNestedInputChange('professionalLicense', 'council', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                  >
                    <option value="Não Possui">Não Possui</option>
                    <option value="COREN">COREN</option>
                    <option value="CRM">CRM</option>
                    <option value="CRF">CRF</option>
                    <option value="CRESS">CRESS</option>
                    <option value="CRN">CRN</option>
                    <option value="CREFITO">CREFITO</option>
                    <option value="CRA">CRA</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                {formData.professionalLicense?.council !== 'Não Possui' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número da Carteira
                      </label>
                      <input
                        type="text"
                        value={formData.professionalLicense?.licenseNumber || ''}
                        onChange={(e) => handleNestedInputChange('professionalLicense', 'licenseNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Vencimento
                      </label>
                      <input
                        type="date"
                        value={formData.professionalLicense?.expiryDate || ''}
                        onChange={(e) => handleNestedInputChange('professionalLicense', 'expiryDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                      />
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Vacinas COVID */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Vacinas COVID
              </h3>
              <div className="mb-4">
                <button
                  type="button"
                  onClick={addCovidVaccine}
                  className="flex items-center px-3 py-1 text-sm text-acasa-purple border border-acasa-purple rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <Plus size={16} className="mr-1" />
                  Adicionar Vacina COVID
                </button>
              </div>
              <div className="space-y-3">
                {formData.covidVaccines.map((vaccine) => (
                  <div key={vaccine.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <select
                      value={vaccine.dose}
                      onChange={(e) => updateCovidVaccine(vaccine.id, 'dose', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    >
                      <option value="1ª Dose">1ª Dose</option>
                      <option value="2ª Dose">2ª Dose</option>
                      <option value="3ª Dose">3ª Dose</option>
                      <option value="Reforço">Reforço</option>
                      <option value="Bivalente">Bivalente</option>
                    </select>
                    <select
                      value={vaccine.vaccineType}
                      onChange={(e) => updateCovidVaccine(vaccine.id, 'vaccineType', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    >
                      <option value="Pfizer">Pfizer</option>
                      <option value="CoronaVac">CoronaVac</option>
                      <option value="AstraZeneca">AstraZeneca</option>
                      <option value="Janssen">Janssen</option>
                      <option value="Outro">Outro</option>
                    </select>
                    <input
                      type="date"
                      value={vaccine.applicationDate}
                      onChange={(e) => updateCovidVaccine(vaccine.id, 'applicationDate', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                    <input
                      type="date"
                      value={vaccine.expiryDate || ''}
                      onChange={(e) => updateCovidVaccine(vaccine.id, 'expiryDate', e.target.value)}
                      placeholder="Vencimento"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={vaccine.notes || ''}
                      onChange={(e) => updateCovidVaccine(vaccine.id, 'notes', e.target.value)}
                      placeholder="Observações"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => removeCovidVaccine(vaccine.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Campos Condicionais por Tipo de Vínculo */}
            {formData.employmentType === 'CLT' && (
              <>
                {/* Documentos CLT */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                    Documentos CLT
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CTPS
                      </label>
                      <input
                        type="text"
                        value={formData.cltData?.ctps || ''}
                        onChange={(e) => handleNestedInputChange('cltData', 'ctps', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Série CTPS
                      </label>
                      <input
                        type="text"
                        value={formData.cltData?.ctpsSeries || ''}
                        onChange={(e) => handleNestedInputChange('cltData', 'ctpsSeries', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PIS
                      </label>
                      <input
                        type="text"
                        value={formData.cltData?.pis || ''}
                        onChange={(e) => handleNestedInputChange('cltData', 'pis', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título de Eleitor
                      </label>
                      <input
                        type="text"
                        value={formData.cltData?.voterTitle || ''}
                        onChange={(e) => handleNestedInputChange('cltData', 'voterTitle', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zona Eleitoral
                      </label>
                      <input
                        type="text"
                        value={formData.cltData?.voterZone || ''}
                        onChange={(e) => handleNestedInputChange('cltData', 'voterZone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seção Eleitoral
                      </label>
                      <input
                        type="text"
                        value={formData.cltData?.voterSection || ''}
                        onChange={(e) => handleNestedInputChange('cltData', 'voterSection', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                      />
                    </div>
                  </div>
                </section>

                {/* Tamanhos de Uniforme */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                    Tamanhos de Uniforme
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Camiseta
                      </label>
                      <select
                        value={formData.cltData?.uniformSize?.shirt || 'M'}
                        onChange={(e) => handleDeepNestedInputChange('cltData', 'uniformSize', 'shirt', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                      >
                        <option value="PP">PP</option>
                        <option value="P">P</option>
                        <option value="M">M</option>
                        <option value="G">G</option>
                        <option value="GG">GG</option>
                        <option value="XG">XG</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Calça
                      </label>
                      <input
                        type="text"
                        value={formData.cltData?.uniformSize?.pants || ''}
                        onChange={(e) => handleDeepNestedInputChange('cltData', 'uniformSize', 'pants', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                        placeholder="Ex: 40, 42, 44"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sapato
                      </label>
                      <input
                        type="text"
                        value={formData.cltData?.uniformSize?.shoes || ''}
                        onChange={(e) => handleDeepNestedInputChange('cltData', 'uniformSize', 'shoes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                        placeholder="Ex: 38, 39, 40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jaleco
                      </label>
                      <select
                        value={formData.cltData?.uniformSize?.coat || 'M'}
                        onChange={(e) => handleDeepNestedInputChange('cltData', 'uniformSize', 'coat', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                      >
                        <option value="PP">PP</option>
                        <option value="P">P</option>
                        <option value="M">M</option>
                        <option value="G">G</option>
                        <option value="GG">GG</option>
                        <option value="XG">XG</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Exames Médicos */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                    Exames Médicos
                  </h3>
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={addMedicalExam}
                      className="flex items-center px-3 py-1 text-sm text-acasa-purple border border-acasa-purple rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      <Plus size={16} className="mr-1" />
                      Adicionar Exame
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.cltData?.medicalExams.map((exam) => (
                      <div key={exam.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <select
                            value={exam.type}
                            onChange={(e) => updateMedicalExam(exam.id, 'type', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                          >
                            <option value="ASO">ASO</option>
                            <option value="Hemograma">Hemograma</option>
                            <option value="Outro">Outro</option>
                          </select>
                          <input
                            type="date"
                            value={exam.examDate}
                            onChange={(e) => updateMedicalExam(exam.id, 'examDate', e.target.value)}
                            placeholder="Data do Exame"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                          />
                          <input
                            type="date"
                            value={exam.expiryDate}
                            onChange={(e) => updateMedicalExam(exam.id, 'expiryDate', e.target.value)}
                            placeholder="Data de Validade"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <select
                            value={exam.result}
                            onChange={(e) => updateMedicalExam(exam.id, 'result', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                          >
                            <option value="Apto">Apto</option>
                            <option value="Inapto">Inapto</option>
                            <option value="Apto com Restrições">Apto com Restrições</option>
                          </select>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={exam.notes || ''}
                              onChange={(e) => updateMedicalExam(exam.id, 'notes', e.target.value)}
                              placeholder="Observações"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => removeMedicalExam(exam.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {formData.employmentType === 'Contrato' && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  Dados do Contrato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Início do Contrato
                    </label>
                    <input
                      type="date"
                      value={formData.contractData?.contractStartDate || ''}
                      onChange={(e) => handleNestedInputChange('contractData', 'contractStartDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Fim do Contrato
                    </label>
                    <input
                      type="date"
                      value={formData.contractData?.contractEndDate || ''}
                      onChange={(e) => handleNestedInputChange('contractData', 'contractEndDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profissão
                    </label>
                    <input
                      type="text"
                      value={formData.contractData?.profession || ''}
                      onChange={(e) => handleNestedInputChange('contractData', 'profession', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={formData.contractData?.phone || ''}
                      onChange={(e) => handleNestedInputChange('contractData', 'phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.contractData?.email || ''}
                      onChange={(e) => handleNestedInputChange('contractData', 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>
                </div>

                <h4 className="text-md font-semibold text-gray-900 mb-3">Dados Bancários</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Banco
                    </label>
                    <input
                      type="text"
                      value={formData.contractData?.bankData?.bank || ''}
                      onChange={(e) => handleDeepNestedInputChange('contractData', 'bankData', 'bank', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agência
                    </label>
                    <input
                      type="text"
                      value={formData.contractData?.bankData?.agency || ''}
                      onChange={(e) => handleDeepNestedInputChange('contractData', 'bankData', 'agency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Conta
                    </label>
                    <input
                      type="text"
                      value={formData.contractData?.bankData?.account || ''}
                      onChange={(e) => handleDeepNestedInputChange('contractData', 'bankData', 'account', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Conta
                    </label>
                    <select
                      value={formData.contractData?.bankData?.accountType || 'Corrente'}
                      onChange={(e) => handleDeepNestedInputChange('contractData', 'bankData', 'accountType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    >
                      <option value="Corrente">Corrente</option>
                      <option value="Poupança">Poupança</option>
                    </select>
                  </div>
                </div>
              </section>
            )}

            {formData.employmentType === 'Terceirizado' && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  Dados do Terceirizado
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Empresa
                    </label>
                    <input
                      type="text"
                      value={formData.outsourcedData?.companyName || ''}
                      onChange={(e) => handleNestedInputChange('outsourcedData', 'companyName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CNPJ da Empresa
                    </label>
                    <input
                      type="text"
                      value={formData.outsourcedData?.companyCnpj || ''}
                      onChange={(e) => handleNestedInputChange('outsourcedData', 'companyCnpj', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Responsável Direto
                    </label>
                    <input
                      type="text"
                      value={formData.outsourcedData?.directSupervisor || ''}
                      onChange={(e) => handleNestedInputChange('outsourcedData', 'directSupervisor', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Serviço
                    </label>
                    <input
                      type="text"
                      value={formData.outsourcedData?.serviceType || ''}
                      onChange={(e) => handleNestedInputChange('outsourcedData', 'serviceType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Início do Contrato
                    </label>
                    <input
                      type="date"
                      value={formData.outsourcedData?.contractStartDate || ''}
                      onChange={(e) => handleNestedInputChange('outsourcedData', 'contractStartDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Fim do Contrato
                    </label>
                    <input
                      type="date"
                      value={formData.outsourcedData?.contractEndDate || ''}
                      onChange={(e) => handleNestedInputChange('outsourcedData', 'contractEndDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Observações */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Observações
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações Gerais
                </label>
                <textarea
                  value={formData.observations || ''}
                  onChange={(e) => handleInputChange('observations', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                  rows={4}
                  placeholder="Observações importantes sobre o colaborador..."
                />
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
              className="flex items-center px-6 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save size={16} className="mr-2" />
              )}
              {employee ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};