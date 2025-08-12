import React, { useState } from 'react';
import { Save, X, User, Phone, MapPin, Briefcase, Upload, Shield } from 'lucide-react';
import { useTalentBank } from '../../contexts/TalentBankContext';
import { Candidate, CandidateFormData, COMMON_POSITIONS, AVAILABILITY_OPTIONS, CANDIDATE_SOURCES } from '../../types/talentBank';
import { isValidCandidatePhone } from '../../types/talentBank';

interface CandidateFormModalProps {
  candidate?: Candidate | null;
  onClose: () => void;
  onSaved: () => void;
}

export const CandidateFormModal: React.FC<CandidateFormModalProps> = ({ candidate, onClose, onSaved }) => {
  const { addCandidate, updateCandidate } = useTalentBank();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CandidateFormData>({
    full_name: candidate?.full_name || '',
    email: candidate?.email || '',
    phone: candidate?.phone || '',
    desired_position: candidate?.desired_position || '',
    experience_years: candidate?.experience_years || 0,
    curriculum_url: candidate?.curriculum_url || '',
    city: candidate?.city || '',
    state: candidate?.state || 'RJ',
    availability: candidate?.availability || '',
    salary_expectation: candidate?.salary_expectation || '',
    status: candidate?.status || 'Novo',
    source: candidate?.source || 'Manual/CRM',
    notes: candidate?.notes || '',
  });

  const handleInputChange = (field: keyof CandidateFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handlePhoneChange = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    let formattedPhone = phone;
    
    // Auto-format phone as user types
    if (cleanPhone.length >= 10) {
      if (cleanPhone.length === 10) {
        formattedPhone = `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
      } else if (cleanPhone.length === 11) {
        formattedPhone = `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
      }
    }
    
    handleInputChange('phone', formattedPhone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.phone || !isValidCandidatePhone(formData.phone)) {
        setError('Telefone é obrigatório e deve ser válido');
        setIsLoading(false);
        return;
      }

      if (!formData.full_name.trim()) {
        setError('Nome completo é obrigatório');
        setIsLoading(false);
        return;
      }

      if (!formData.email.trim() || !formData.email.includes('@')) {
        setError('Email válido é obrigatório');
        setIsLoading(false);
        return;
      }

      if (candidate) {
        // Update existing candidate
        await updateCandidate(candidate.id, formData as any);
      } else {
        // Create new candidate
        await addCandidate(formData);
      }

      onSaved();
    } catch (error) {
      console.error('Error saving candidate:', error);
      setError('Erro ao salvar candidato. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {candidate ? 'Editar Candidato' : 'Novo Candidato'}
            </h2>
            <p className="text-gray-600">
              {candidate ? 'Atualize as informações do candidato' : 'Cadastre um novo candidato no banco de talentos'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-140px)]">
          <div className="p-6 space-y-8">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Personal Information */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center">
                <User className="mr-2 text-green-600" size={20} />
                Informações Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nome completo do candidato"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="(21) 99999-9999"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex: Rio de Janeiro"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado *
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="SP">São Paulo</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Professional Information */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center">
                <Briefcase className="mr-2 text-blue-600" size={20} />
                Informações Profissionais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo Desejado *
                  </label>
                  <select
                    value={formData.desired_position}
                    onChange={(e) => handleInputChange('desired_position', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecione um cargo...</option>
                    {COMMON_POSITIONS.map(position => (
                      <option key={position} value={position}>{position}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anos de Experiência *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.experience_years || ''}
                    onChange={(e) => handleInputChange('experience_years', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Anos de experiência"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disponibilidade
                  </label>
                  <select
                    value={formData.availability}
                    onChange={(e) => handleInputChange('availability', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    {AVAILABILITY_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pretensão Salarial
                  </label>
                  <input
                    type="text"
                    value={formData.salary_expectation}
                    onChange={(e) => handleInputChange('salary_expectation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex: R$ 3.000,00 ou A combinar"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currículo (URL)
                  </label>
                  <input
                    type="url"
                    value={formData.curriculum_url}
                    onChange={(e) => handleInputChange('curriculum_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Origem do Candidato
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {CANDIDATE_SOURCES.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status no Pipeline
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Novo">Novo</option>
                    <option value="Triagem">Triagem</option>
                    <option value="Entrevista Agendada">Entrevista Agendada</option>
                    <option value="Entrevistado">Entrevistado</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Contratado">Contratado</option>
                    <option value="Rejeitado">Rejeitado</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações Internas
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Anotações sobre o candidato, avaliações, etc..."
                  />
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
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save size={16} className="mr-2" />
              )}
              {candidate ? 'Atualizar' : 'Criar'} Candidato
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};