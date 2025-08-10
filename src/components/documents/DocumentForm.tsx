import React, { useState } from 'react';
import { Save, X, Upload } from 'lucide-react';
import { DocumentTemplate } from '../../types';
import { useDocuments } from '../../contexts/DocumentContext';

interface DocumentFormProps {
  document?: DocumentTemplate;
  onClose: () => void;
  onSave: () => void;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({ document, onClose, onSave }) => {
  const { addDocument, updateDocument } = useDocuments();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt' | 'revisionHistory'>>({
    category: document?.category || 'Formulário',
    name: document?.name || '',
    description: document?.description || '',
    fileType: document?.fileType || 'PDF',
    attachment: document?.attachment || '',
    lastRevisionDate: document?.lastRevisionDate || new Date().toISOString().split('T')[0],
    lastRevisionResponsible: document?.lastRevisionResponsible || '',
    status: document?.status || 'Ativo',
    revisionPeriodicity: document?.revisionPeriodicity || 'Anual',
    internalNotes: document?.internalNotes || '',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Em uma implementação real, você faria upload para um servidor
      // Por enquanto, simularemos com um URL fake
      const fakeUrl = `https://example.com/documents/${file.name}`;
      handleInputChange('attachment', fakeUrl);
      
      // Detectar tipo de arquivo automaticamente
      const extension = file.name.split('.').pop()?.toUpperCase();
      if (extension && ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX', 'TXT'].includes(extension)) {
        handleInputChange('fileType', extension as any);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (document) {
        updateDocument(document.id, formData);
      } else {
        addDocument({
          ...formData,
          revisionHistory: [],
        });
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {document ? 'Editar Documento' : 'Novo Documento'}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  >
                    <option value="Contrato">Contrato</option>
                    <option value="Formulário">Formulário</option>
                    <option value="Política">Política</option>
                    <option value="Procedimento">Procedimento</option>
                    <option value="Manual">Manual</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Arquivo *
                  </label>
                  <select
                    value={formData.fileType}
                    onChange={(e) => handleInputChange('fileType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  >
                    <option value="PDF">PDF</option>
                    <option value="DOC">DOC</option>
                    <option value="DOCX">DOCX</option>
                    <option value="XLS">XLS</option>
                    <option value="XLSX">XLSX</option>
                    <option value="PPT">PPT</option>
                    <option value="PPTX">PPTX</option>
                    <option value="TXT">TXT</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Documento *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    placeholder="Ex: Contrato de Prestação de Serviços"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    rows={3}
                    placeholder="Descreva o propósito e conteúdo do documento..."
                    required
                  />
                </div>
              </div>
            </section>

            {/* Upload de Arquivo */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Arquivo
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anexo *
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors">
                    <Upload size={16} className="mr-2" />
                    Selecionar Arquivo
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    />
                  </label>
                  {formData.attachment && (
                    <span className="text-sm text-gray-600">
                      Arquivo selecionado: {formData.attachment.split('/').pop()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Formatos aceitos: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
                </p>
              </div>
            </section>

            {/* Informações de Controle */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Controle e Revisão
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data da Última Revisão *
                  </label>
                  <input
                    type="date"
                    value={formData.lastRevisionDate}
                    onChange={(e) => handleInputChange('lastRevisionDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsável pela Última Revisão *
                  </label>
                  <input
                    type="text"
                    value={formData.lastRevisionResponsible}
                    onChange={(e) => handleInputChange('lastRevisionResponsible', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    placeholder="Nome do responsável"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status do Documento *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Em Revisão">Em Revisão</option>
                    <option value="Aguardando Aprovação">Aguardando Aprovação</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Periodicidade de Revisão *
                  </label>
                  <select
                    value={formData.revisionPeriodicity}
                    onChange={(e) => handleInputChange('revisionPeriodicity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  >
                    <option value="Mensal">Mensal</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Semestral">Semestral</option>
                    <option value="Anual">Anual</option>
                    <option value="Bianual">Bianual</option>
                    <option value="Conforme Necessário">Conforme Necessário</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Observações */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Observações
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações Internas
                </label>
                <textarea
                  value={formData.internalNotes}
                  onChange={(e) => handleInputChange('internalNotes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                  rows={4}
                  placeholder="Observações internas sobre o documento, instruções especiais, etc..."
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
              {document ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};