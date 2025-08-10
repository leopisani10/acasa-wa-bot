import React, { useState } from 'react';
import { Save, X, Upload } from 'lucide-react';
import { DocumentTemplate, DocumentRevision } from '../../types';
import { useDocuments } from '../../contexts/DocumentContext';

interface RevisionFormProps {
  document: DocumentTemplate;
  onClose: () => void;
  onSave: () => void;
}

export const RevisionForm: React.FC<RevisionFormProps> = ({ document, onClose, onSave }) => {
  const { addRevision } = useDocuments();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    revisionDate: new Date().toISOString().split('T')[0],
    responsible: '',
    changes: '',
    version: `v${document.revisionHistory.length + 1}.0`,
    previousAttachment: document.attachment,
    newAttachment: '',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Em uma implementação real, você faria upload para um servidor
      const fakeUrl = `https://example.com/documents/revisions/${file.name}`;
      handleInputChange('newAttachment', fakeUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const revisionData: Omit<DocumentRevision, 'id'> = {
        revisionDate: formData.revisionDate,
        responsible: formData.responsible,
        changes: formData.changes,
        version: formData.version,
        previousAttachment: formData.previousAttachment,
        newAttachment: formData.newAttachment || formData.previousAttachment,
      };

      addRevision(document.id, revisionData);
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar revisão:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nova Revisão</h2>
            <p className="text-sm text-gray-600">Documento: {document.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Informações da Revisão */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Informações da Revisão
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data da Revisão *
                  </label>
                  <input
                    type="date"
                    value={formData.revisionDate}
                    onChange={(e) => handleInputChange('revisionDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Versão *
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => handleInputChange('version', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    placeholder="Ex: v1.1, v2.0"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsável pela Revisão *
                  </label>
                  <input
                    type="text"
                    value={formData.responsible}
                    onChange={(e) => handleInputChange('responsible', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    placeholder="Nome do responsável pela revisão"
                    required
                  />
                </div>
              </div>
            </section>

            {/* Alterações */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Descrição das Alterações
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mudanças Realizadas *
                </label>
                <textarea
                  value={formData.changes}
                  onChange={(e) => handleInputChange('changes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                  rows={4}
                  placeholder="Descreva as alterações realizadas nesta revisão..."
                  required
                />
              </div>
            </section>

            {/* Novo Arquivo (Opcional) */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Arquivo Atualizado (Opcional)
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Novo Arquivo
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
                  {formData.newAttachment && formData.newAttachment !== formData.previousAttachment && (
                    <span className="text-sm text-gray-600">
                      Novo arquivo: {formData.newAttachment.split('/').pop()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Deixe em branco para manter o arquivo atual. Formatos aceitos: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
                </p>
              </div>
            </section>

            {/* Resumo */}
            <section className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Resumo da Revisão</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Documento:</strong> {document.name}</div>
                <div><strong>Categoria:</strong> {document.category}</div>
                <div><strong>Última Revisão Anterior:</strong> {new Date(document.lastRevisionDate).toLocaleDateString('pt-BR')}</div>
                <div><strong>Total de Revisões:</strong> {document.revisionHistory.length}</div>
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
              Salvar Revisão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};