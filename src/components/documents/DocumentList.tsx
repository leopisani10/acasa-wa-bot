import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, FileText, Calendar, RefreshCw, Filter } from 'lucide-react';
import { useDocuments } from '../../contexts/DocumentContext';
import { DocumentTemplate } from '../../types';

interface DocumentListProps {
  onAddDocument: () => void;
  onEditDocument: (document: DocumentTemplate) => void;
  onNewRevision: (document: DocumentTemplate) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ onAddDocument, onEditDocument, onNewRevision }) => {
  const { documents, deleteDocument } = useDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<DocumentTemplate | null>(null);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.lastRevisionResponsible.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDelete = (document: DocumentTemplate) => {
    if (window.confirm(`Tem certeza que deseja excluir o documento "${document.name}"?`)) {
      deleteDocument(document.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-100 text-green-700';
      case 'Inativo': return 'bg-red-100 text-red-700';
      case 'Em Revisão': return 'bg-yellow-100 text-yellow-700';
      case 'Aguardando Aprovação': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Modelos</h2>
          <p className="text-gray-600">Gerencie os modelos de documentos da ACASA</p>
        </div>
        <button
          onClick={onAddDocument}
          className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Novo Documento
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
        >
          <option value="all">Todas as Categorias</option>
          <option value="Contrato">Contrato</option>
          <option value="Formulário">Formulário</option>
          <option value="Política">Política</option>
          <option value="Procedimento">Procedimento</option>
          <option value="Manual">Manual</option>
          <option value="Outro">Outro</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
        >
          <option value="all">Todos os Status</option>
          <option value="Ativo">Ativo</option>
          <option value="Inativo">Inativo</option>
          <option value="Em Revisão">Em Revisão</option>
          <option value="Aguardando Aprovação">Aguardando Aprovação</option>
        </select>
        <div className="flex items-center text-sm text-gray-600">
          <Filter size={16} className="mr-1" />
          {filteredDocuments.length} de {documents.length} documentos
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
            </div>
            <FileText className="text-acasa-purple" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Ativos</p>
              <p className="text-2xl font-bold text-gray-900">
                {documents.filter(d => d.status === 'Ativo').length}
              </p>
            </div>
            <FileText className="text-green-600" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Em Revisão</p>
              <p className="text-2xl font-bold text-gray-900">
                {documents.filter(d => d.status === 'Em Revisão').length}
              </p>
            </div>
            <RefreshCw className="text-yellow-600" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Aguardando</p>
              <p className="text-2xl font-bold text-gray-900">
                {documents.filter(d => d.status === 'Aguardando Aprovação').length}
              </p>
            </div>
            <Calendar className="text-blue-600" size={20} />
          </div>
        </div>
      </div>

      {/* Document Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((document) => (
          <div key={document.id} className="bg-white rounded-lg border border-gray-100 hover:border-acasa-purple transition-all duration-200">
            <div className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 mb-1 font-sans">{document.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2 font-sans">{document.description}</p>
                  <div className="text-sm text-gray-500 space-y-0.5 font-sans">
                    <div className="flex items-center">
                      <FileText size={14} className="mr-1 font-sans" />
                      <span className="font-sans">{document.category} • {document.fileType}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1 font-sans" />
                      <span className="font-sans">Última revisão: {formatDate(document.lastRevisionDate)}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full font-sans ${getStatusColor(document.status)}`}>
                  {document.status}
                </span>
              </div>

              <div className="space-y-1 text-sm text-gray-500 mb-4 border-t border-gray-50 pt-3 font-sans">
                <div>
                  <span className="text-gray-400 font-sans">Responsável:</span> <span className="font-sans">{document.lastRevisionResponsible}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-sans">Periodicidade:</span> <span className="font-sans">{document.revisionPeriodicity}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-sans">Revisões:</span> <span className="font-sans">{document.revisionHistory.length}</span>
                </div>
              </div>

              <div className="flex items-center space-x-1 pt-3 border-t border-gray-50">
                <button
                  onClick={() => setSelectedDocument(document)}
                  className="flex-1 text-center py-2 text-acasa-purple hover:bg-gray-50 rounded transition-colors text-sm font-medium font-sans"
                >
                  Ver
                </button>
                <button
                  onClick={() => onNewRevision(document)}
                  className="flex-1 text-center py-2 text-blue-600 hover:bg-gray-50 rounded transition-colors text-sm font-medium font-sans"
                >
                  Nova Revisão
                </button>
                <button
                  onClick={() => onEditDocument(document)}
                  className="p-2 text-green-600 hover:bg-gray-50 rounded transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(document)}
                  className="p-2 text-red-600 hover:bg-gray-50 rounded transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum documento encontrado</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Tente ajustar os filtros de busca.'
              : 'Comece adicionando o primeiro modelo de documento.'}
          </p>
          {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && (
            <button
              onClick={onAddDocument}
              className="inline-flex items-center px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Adicionar Documento
            </button>
          )}
        </div>
      )}

      {/* Document Detail Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Detalhes do Documento</h2>
              <button
                onClick={() => setSelectedDocument(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Informações Básicas</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Nome:</strong> {selectedDocument.name}</div>
                      <div><strong>Categoria:</strong> {selectedDocument.category}</div>
                      <div><strong>Tipo de Arquivo:</strong> {selectedDocument.fileType}</div>
                      <div><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedDocument.status)}`}>{selectedDocument.status}</span></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Informações de Revisão</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Última Revisão:</strong> {formatDate(selectedDocument.lastRevisionDate)}</div>
                      <div><strong>Responsável:</strong> {selectedDocument.lastRevisionResponsible}</div>
                      <div><strong>Periodicidade:</strong> {selectedDocument.revisionPeriodicity}</div>
                      <div><strong>Total de Revisões:</strong> {selectedDocument.revisionHistory.length}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Descrição</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedDocument.description}</p>
                </div>

                {selectedDocument.internalNotes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Observações Internas</h3>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedDocument.internalNotes}</p>
                  </div>
                )}

                {selectedDocument.revisionHistory.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Histórico de Revisões</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {selectedDocument.revisionHistory.map((revision) => (
                        <div key={revision.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium text-sm">Versão {revision.version}</div>
                              <div className="text-xs text-gray-600">{formatDate(revision.revisionDate)} - {revision.responsible}</div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{revision.changes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedDocument(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  onNewRevision(selectedDocument);
                  setSelectedDocument(null);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw size={16} className="mr-2" />
                Nova Revisão
              </button>
              <button
                onClick={() => {
                  onEditDocument(selectedDocument);
                  setSelectedDocument(null);
                }}
                className="flex items-center px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Edit size={16} className="mr-2" />
                Editar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};