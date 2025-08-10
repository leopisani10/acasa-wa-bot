import React, { useState, useEffect } from 'react';
import { Save, X, User, Phone, MapPin, Shield } from 'lucide-react';
import { useCRM } from '../../contexts/CRMContext';
import { Lead, Contact, ContactFormData, LeadFormData, VALUE_BANDS, DEPENDENCY_GRADES } from '../../types/crm';
import { isValidPhone } from '../../types/crm';

interface LeadFormModalProps {
  lead?: Lead | null;
  onClose: () => void;
  onSaved: () => void;
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({ lead, onClose, onSaved }) => {
  const { addLead, updateLead, units, leads, findContactByPhone } = useCRM();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contactData, setContactData] = useState<ContactFormData>({
    full_name: lead?.contact?.full_name || '',
    relation: lead?.contact?.relation || '',
    phone: lead?.contact?.phone || '',
    email: lead?.contact?.email || '',
    neighborhood: lead?.contact?.neighborhood || '',
    unit_id: lead?.contact?.unit_id || '',
    lgpd_consent: lead?.contact?.lgpd_consent || false,
    notes: lead?.contact?.notes || '',
  });

  const [leadData, setLeadData] = useState<LeadFormData>({
    elderly_name: lead?.elderly_name || '',
    elderly_age: lead?.elderly_age || 70,
    diagnosis: lead?.diagnosis || '',
    dependency_grade: lead?.dependency_grade || 'I',
    value_band: lead?.value_band || '',
    stage: lead?.stage || 'Novo',
    owner_id: lead?.owner_id || '',
    source: lead?.source || 'Manual/CRM',
  });

  // Get unique owners from existing leads
  const owners = Array.from(new Set(leads.map(lead => lead.owner).filter(Boolean)));

  const handleContactChange = (field: keyof ContactFormData, value: any) => {
    setContactData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleLeadChange = (field: keyof LeadFormData, value: any) => {
    setLeadData(prev => ({ ...prev, [field]: value }));
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
    
    handleContactChange('phone', formattedPhone);

    // Check for existing contact
    if (isValidPhone(formattedPhone) && !lead) {
      const existingContact = findContactByPhone(formattedPhone);
      if (existingContact) {
        setContactData({
          full_name: existingContact.full_name || '',
          relation: existingContact.relation || '',
          phone: existingContact.phone || '',
          email: existingContact.email || '',
          neighborhood: existingContact.neighborhood || '',
          unit_id: existingContact.unit_id || '',
          lgpd_consent: existingContact.lgpd_consent,
          notes: existingContact.notes || '',
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validation
      if (!contactData.phone || !isValidPhone(contactData.phone)) {
        setError('Telefone é obrigatório e deve ser válido');
        setIsLoading(false);
        return;
      }

      if (!contactData.full_name.trim()) {
        setError('Nome do contato é obrigatório');
        setIsLoading(false);
        return;
      }

      if (lead) {
        // Update existing lead
        await updateLead(lead.id, leadData as any);
        if (lead.contact) {
          // Update contact data if needed
          // This would require implementing updateContact in the context
        }
      } else {
        // Create new lead
        await addLead(leadData as any, contactData as any);
      }

      onSaved();
    } catch (error) {
      console.error('Error saving lead:', error);
      setError('Erro ao salvar lead. Tente novamente.');
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
              {lead ? 'Editar Lead' : 'Novo Lead'}
            </h2>
            <p className="text-gray-600">
              {lead ? 'Atualize as informações do lead' : 'Cadastre um novo lead comercial'}
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

            {/* Contact Information */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center">
                <User className="mr-2 text-blue-600" size={20} />
                Informações do Contato
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={contactData.full_name}
                    onChange={(e) => handleContactChange('full_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome completo do contato"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parentesco
                  </label>
                  <select
                    value={contactData.relation}
                    onChange={(e) => handleContactChange('relation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    <option value="Filho(a)">Filho(a)</option>
                    <option value="Neto(a)">Neto(a)</option>
                    <option value="Cônjuge">Cônjuge</option>
                    <option value="Irmão(ã)">Irmão(ã)</option>
                    <option value="Sobrinho(a)">Sobrinho(a)</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    value={contactData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(21) 99999-9999"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contactData.email}
                    onChange={(e) => handleContactChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={contactData.neighborhood}
                    onChange={(e) => handleContactChange('neighborhood', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Bairro de interesse"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidade de Interesse
                  </label>
                  <select
                    value={contactData.unit_id}
                    onChange={(e) => handleContactChange('unit_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma unidade...</option>
                    {units.map(unit => (
                      <option key={unit.id} value={unit.id}>{unit.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações do Contato
                  </label>
                  <textarea
                    value={contactData.notes}
                    onChange={(e) => handleContactChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Informações adicionais sobre o contato..."
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Shield className="text-blue-600 mr-3" size={20} />
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contactData.lgpd_consent}
                        onChange={(e) => handleContactChange('lgpd_consent', e.target.checked)}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-blue-800">
                        Autorizo o uso dos meus dados para comunicações da ACASA (LGPD)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* Lead Information */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center">
                <MapPin className="mr-2 text-green-600" size={20} />
                Informações do Lead
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Idoso
                  </label>
                  <input
                    type="text"
                    value={leadData.elderly_name}
                    onChange={(e) => handleLeadChange('elderly_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nome do futuro residente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Idade do Idoso
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="120"
                    value={leadData.elderly_age || ''}
                    onChange={(e) => handleLeadChange('elderly_age', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Idade"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grau de Dependência
                  </label>
                  <select
                    value={leadData.dependency_grade}
                    onChange={(e) => handleLeadChange('dependency_grade', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {DEPENDENCY_GRADES.map(grade => (
                      <option key={grade.value} value={grade.value}>
                        {grade.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Faixa de Valor
                  </label>
                  <select
                    value={leadData.value_band}
                    onChange={(e) => handleLeadChange('value_band', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    {VALUE_BANDS.map(band => (
                      <option key={band} value={band}>{band}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estágio do Lead
                  </label>
                  <select
                    value={leadData.stage}
                    onChange={(e) => handleLeadChange('stage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Novo">Novo</option>
                    <option value="Qualificando">Qualificando</option>
                    <option value="Agendou visita">Agendou visita</option>
                    <option value="Visitou">Visitou</option>
                    <option value="Proposta">Proposta</option>
                    <option value="Fechado">Fechado</option>
                    <option value="Perdido">Perdido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsável
                  </label>
                  <select
                    value={leadData.owner_id}
                    onChange={(e) => handleLeadChange('owner_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Não atribuído</option>
                    {owners.map(owner => (
                      <option key={owner?.id} value={owner?.id}>{owner?.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagnóstico/Condição
                  </label>
                  <textarea
                    value={leadData.diagnosis}
                    onChange={(e) => handleLeadChange('diagnosis', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Descrição do estado de saúde e necessidades do idoso..."
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
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save size={16} className="mr-2" />
              )}
              {lead ? 'Atualizar' : 'Criar'} Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};