import React, { useState } from 'react';
import { Send, User, Phone, Mail, Briefcase, MapPin, Shield, CheckCircle, Upload } from 'lucide-react';
import { useTalentBank } from '../../contexts/TalentBankContext';
import { PublicCandidateFormData, COMMON_POSITIONS, AVAILABILITY_OPTIONS } from '../../types/talentBank';
import { isValidCandidatePhone } from '../../types/talentBank';

export const PublicCandidateForm: React.FC = () => {
  const { addPublicCandidate } = useTalentBank();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<PublicCandidateFormData>({
    full_name: '',
    email: '',
    phone: '',
    desired_position: '',
    experience_years: 0,
    city: '',
    availability: '',
    salary_expectation: '',
    lgpd_consent: false,
  });

  const handleInputChange = (field: keyof PublicCandidateFormData, value: any) => {
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

      if (!formData.phone || !isValidCandidatePhone(formData.phone)) {
        setError('Telefone válido é obrigatório');
        setIsLoading(false);
        return;
      }

      if (!formData.desired_position) {
        setError('Cargo desejado é obrigatório');
        setIsLoading(false);
        return;
      }

      if (!formData.lgpd_consent) {
        setError('É necessário autorizar o uso dos dados para prosseguir');
        setIsLoading(false);
        return;
      }

      await addPublicCandidate(formData);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting candidate:', error);
      setError('Erro ao enviar candidatura. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Candidatura Enviada!</h1>
          <p className="text-gray-600 mb-6">
            Obrigado por seu interesse em trabalhar na ACASA! Recebemos sua candidatura e nossa equipe de RH 
            entrará em contato em breve.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📧 Próximos Passos:</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• Análise do seu perfil pela equipe de RH</li>
              <li>• Contato por telefone ou email em até 5 dias úteis</li>
              <li>• Se aprovado, agendamento de entrevista</li>
              <li>• Processo seletivo conforme a vaga</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4">
            <User className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold mb-2">Banco de Talentos</h1>
          <p className="text-green-100">
            Junte-se à equipe da ACASA Residencial Sênior
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Personal Information */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                  placeholder="Seu nome completo"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                  placeholder="seu@email.com"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                  placeholder="Rio de Janeiro"
                  required
                />
              </div>
            </div>
          </section>

          {/* Professional Information */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Briefcase className="mr-2 text-blue-600" size={20} />
              Informações Profissionais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo de Interesse *
                </label>
                <select
                  value={formData.desired_position}
                  onChange={(e) => handleInputChange('desired_position', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disponibilidade para Início *
                </label>
                <select
                  value={formData.availability}
                  onChange={(e) => handleInputChange('availability', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                  required
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                  placeholder="R$ 3.000,00 ou A combinar"
                />
              </div>
            </div>
          </section>

          {/* LGPD Consent */}
          <section>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <Shield className="text-blue-600 mr-3 mt-1 flex-shrink-0" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">Consentimento LGPD</h3>
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.lgpd_consent}
                      onChange={(e) => handleInputChange('lgpd_consent', e.target.checked)}
                      className="mr-3 mt-0.5 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      required
                    />
                    <span className="text-sm text-blue-800 leading-relaxed">
                      <strong>Autorizo</strong> o uso dos meus dados pessoais pela <strong>ACASA Residencial Sênior</strong> para:
                      <br />• Análise da minha candidatura
                      <br />• Comunicação sobre oportunidades de trabalho
                      <br />• Contato para processos seletivos
                      <br />• Armazenamento seguro dos dados fornecidos
                      <br /><br />
                      Seus dados serão tratados conforme a Lei Geral de Proteção de Dados (LGPD).
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isLoading || !formData.lgpd_consent}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-8 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center text-lg"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send className="mr-3" size={24} />
                  Enviar Candidatura
                </>
              )}
            </button>
            <p className="text-sm text-gray-600 mt-3">
              Entraremos em contato em até 5 dias úteis
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
          <div className="text-center">
            <h4 className="font-semibold text-gray-900 mb-2">🏥 Sobre a ACASA Residencial Sênior</h4>
            <p className="text-sm text-gray-600 mb-4">
              Somos uma instituição de longa permanência para idosos que oferece cuidados especializados, 
              ambiente acolhedor e equipe multidisciplinar qualificada.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
              <div>
                <strong>📍 Unidades:</strong>
                <br />Botafogo e Tijuca/RJ
              </div>
              <div>
                <strong>👥 Equipe:</strong>
                <br />+50 profissionais
              </div>
              <div>
                <strong>🎯 Missão:</strong>
                <br />Cuidar com excelência
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};