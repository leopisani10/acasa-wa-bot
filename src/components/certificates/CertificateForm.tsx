import React, { useState } from 'react';
import { Save, X, Upload } from 'lucide-react';
import { Certificate } from '../../types';
import { useCertificates } from '../../contexts/CertificateContext';

interface CertificateFormProps {
  certificate?: Certificate;
  onClose: () => void;
  onSave: () => void;
}

export const CertificateForm: React.FC<CertificateFormProps> = ({ certificate, onClose, onSave }) => {
  const { addCertificate, updateCertificate } = useCertificates();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<Omit<Certificate, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdate' | 'status'>>({
    service: certificate?.service || 'Dedetização',
    unit: certificate?.unit || 'Botafogo',
    executedDate: certificate?.executedDate || '',
    expiryDate: certificate?.expiryDate || '',
    currentCertificate: certificate?.currentCertificate || '',
    responsible: certificate?.responsible || '',
    observations: certificate?.observations || '',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Em uma implementação real, você faria upload para um servidor
      // Por enquanto, simularemos com um URL fake
      const fakeUrl = `https://example.com/certificates/${file.name}`;
      handleInputChange('currentCertificate', fakeUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (certificate) {
        updateCertificate(certificate.id, formData);
      } else {
        addCertificate(formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar certificado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {certificate ? 'Editar Certificado' : 'Novo Certificado'}
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
                Informações do Serviço
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Serviço *
                  </label>
                  <select
                    value={formData.service}
                    onChange={(e) => handleInputChange('service', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  >
                    <option value="Dedetização">Dedetização</option>
                    <option value="Limpeza de Caixa d'Água">Limpeza de Caixa d'Água</option>
                    <option value="Manutenção de Elevador">Manutenção de Elevador</option>
                    <option value="Laudo Elétrico">Laudo Elétrico</option>
                    <option value="AVCB">AVCB</option>
                    <option value="Alvará Sanitário">Alvará Sanitário</option>
                    <option value="Laudo de Segurança">Laudo de Segurança</option>
                    <option value="Outro">Outro</option>
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
                    Data de Execução *
                  </label>
                  <input
                    type="date"
                    value={formData.executedDate}
                    onChange={(e) => handleInputChange('executedDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Vencimento *
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsável *
                  </label>
                  <input
                    type="text"
                    value={formData.responsible}
                    onChange={(e) => handleInputChange('responsible', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    placeholder="Nome do responsável pela execução"
                    required
                  />
                </div>
              </div>
            </section>

            {/* Upload de Certificado */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Certificado
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo do Certificado
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors">
                    <Upload size={16} className="mr-2" />
                    Selecionar Arquivo
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                  </label>
                  {formData.currentCertificate && (
                    <span className="text-sm text-gray-600">
                      Arquivo selecionado: {formData.currentCertificate.split('/').pop()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Formatos aceitos: PDF, JPG, PNG, DOC, DOCX
                </p>
              </div>
            </section>

            {/* Observações */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Observações
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações Adicionais
                </label>
                <textarea
                  value={formData.observations || ''}
                  onChange={(e) => handleInputChange('observations', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                  rows={4}
                  placeholder="Informações adicionais sobre o serviço ou certificado..."
                />
              </div>
            </section>

            {/* Informações Automáticas */}
            {certificate && (
              <section className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Informações do Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Status Atual:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      certificate.status === 'Em dia' ? 'bg-green-100 text-green-700' :
                      certificate.status === 'Pendente' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {certificate.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Última Atualização:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(certificate.lastUpdate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Criado em:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(certificate.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">ID do Certificado:</span>
                    <span className="ml-2 font-mono text-gray-900">#{certificate.id}</span>
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
              {certificate ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};