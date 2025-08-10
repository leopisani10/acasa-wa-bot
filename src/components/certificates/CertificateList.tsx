import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, FileCheck, AlertTriangle, Calendar, Filter, Download } from 'lucide-react';
import { useCertificates } from '../../contexts/CertificateContext';
import { Certificate } from '../../types';

interface CertificateListProps {
  onAddCertificate: () => void;
  onEditCertificate: (certificate: Certificate) => void;
}

export const CertificateList: React.FC<CertificateListProps> = ({ onAddCertificate, onEditCertificate }) => {
  const { certificates, deleteCertificate, getExpiringCertificates } = useCertificates();
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  const expiringCertificates = getExpiringCertificates();

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.responsible.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesService = serviceFilter === 'all' || cert.service === serviceFilter;
    const matchesUnit = unitFilter === 'all' || cert.unit === unitFilter;
    const matchesStatus = statusFilter === 'all' || cert.status === statusFilter;
    return matchesSearch && matchesService && matchesUnit && matchesStatus;
  });

  const handleDelete = (certificate: Certificate) => {
    if (window.confirm(`Tem certeza que deseja excluir o certificado de ${certificate.service}?`)) {
      deleteCertificate(certificate.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em dia': return 'bg-green-100 text-green-700';
      case 'Pendente': return 'bg-yellow-100 text-yellow-700';
      case 'Atrasado': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getExpiryColor = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-red-600 font-semibold'; // Vencido
    if (diffDays <= 30) return 'text-yellow-600 font-semibold'; // Vencendo
    return 'text-green-600'; // Em dia
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Certificados</h2>
          <p className="text-gray-600">Gerencie os certificados e serviços obrigatórios</p>
        </div>
        <button
          onClick={onAddCertificate}
          className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Novo Certificado
        </button>
      </div>

      {/* Alertas de Vencimento */}
      {expiringCertificates.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertTriangle className="text-orange-600 mr-2" size={20} />
            <h3 className="text-lg font-medium text-orange-800">
              {expiringCertificates.length} certificado(s) vencendo ou vencidos
            </h3>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {expiringCertificates.slice(0, 5).map((cert) => (
              <div key={cert.id} className="flex justify-between items-center text-sm">
                <span className="text-orange-700">
                  <strong>{cert.service}</strong> - {cert.unit}
                </span>
                <span className={`font-medium ${cert.status === 'danger' ? 'text-red-600' : 'text-orange-600'}`}>
                  {cert.daysUntilExpiry < 0 ? `${Math.abs(cert.daysUntilExpiry)} dias atraso` : `${cert.daysUntilExpiry} dias`}
                </span>
              </div>
            ))}
            {expiringCertificates.length > 5 && (
              <p className="text-sm text-orange-600">
                +{expiringCertificates.length - 5} certificados adicionais
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar certificados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
          />
        </div>
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
        >
          <option value="all">Todos os Serviços</option>
          <option value="Dedetização">Dedetização</option>
          <option value="Limpeza de Caixa d'Água">Limpeza de Caixa d'Água</option>
          <option value="Manutenção de Elevador">Manutenção de Elevador</option>
          <option value="Laudo Elétrico">Laudo Elétrico</option>
          <option value="AVCB">AVCB</option>
          <option value="Alvará Sanitário">Alvará Sanitário</option>
          <option value="Laudo de Segurança">Laudo de Segurança</option>
          <option value="Outro">Outro</option>
        </select>
        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
        >
          <option value="all">Todas as Unidades</option>
          <option value="Botafogo">Botafogo</option>
          <option value="Tijuca">Tijuca</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
        >
          <option value="all">Todos os Status</option>
          <option value="Em dia">Em dia</option>
          <option value="Pendente">Pendente</option>
          <option value="Atrasado">Atrasado</option>
        </select>
        <div className="flex items-center text-sm text-gray-600">
          <Filter size={16} className="mr-1" />
          {filteredCertificates.length} de {certificates.length}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
            </div>
            <FileCheck className="text-acasa-purple" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Em Dia</p>
              <p className="text-2xl font-bold text-gray-900">
                {certificates.filter(c => c.status === 'Em dia').length}
              </p>
            </div>
            <FileCheck className="text-green-600" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">
                {certificates.filter(c => c.status === 'Pendente').length}
              </p>
            </div>
            <Calendar className="text-yellow-600" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Atrasados</p>
              <p className="text-2xl font-bold text-gray-900">
                {certificates.filter(c => c.status === 'Atrasado').length}
              </p>
            </div>
            <AlertTriangle className="text-red-600" size={20} />
          </div>
        </div>
      </div>

      {/* Certificate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCertificates.map((certificate) => (
          <div key={certificate.id} className="bg-white rounded-lg border border-gray-100 hover:border-acasa-purple transition-all duration-200">
            <div className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 mb-1 font-sans">{certificate.service}</h3>
                  <div className="text-sm text-gray-500 space-y-0.5 font-sans">
                    <div className="font-sans">{certificate.unit}</div>
                    <div className="font-sans">Responsável: {certificate.responsible}</div>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full font-sans ${getStatusColor(certificate.status)}`}>
                  {certificate.status}
                </span>
              </div>

              <div className="space-y-1 text-sm text-gray-500 mb-4 border-t border-gray-50 pt-3 font-sans">
                <div>
                  <span className="text-gray-400 font-sans">Executado:</span> <span className="font-sans">{formatDate(certificate.executedDate)}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-sans">Vencimento:</span> 
                  <span className={`ml-1 font-sans ${getExpiryColor(certificate.expiryDate)}`}>
                    {formatDate(certificate.expiryDate)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 font-sans">Última atualização:</span> <span className="font-sans">{formatDate(certificate.lastUpdate)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-1 pt-3 border-t border-gray-50">
                <button
                  onClick={() => setSelectedCertificate(certificate)}
                  className="flex-1 text-center py-2 text-acasa-purple hover:bg-gray-50 rounded transition-colors text-sm font-medium font-sans"
                >
                  Ver
                </button>
                <button
                  onClick={() => onEditCertificate(certificate)}
                  className="flex-1 text-center py-2 text-green-600 hover:bg-gray-50 rounded transition-colors text-sm font-medium font-sans"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(certificate)}
                  className="p-2 text-red-600 hover:bg-gray-50 rounded transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCertificates.length === 0 && (
        <div className="text-center py-12">
          <FileCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum certificado encontrado</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || serviceFilter !== 'all' || unitFilter !== 'all'
              ? 'Tente ajustar os filtros de busca.'
              : 'Comece adicionando o primeiro certificado.'}
          </p>
          {!searchTerm && serviceFilter === 'all' && unitFilter === 'all' && (
            <button
              onClick={onAddCertificate}
              className="inline-flex items-center px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Adicionar Certificado
            </button>
          )}
        </div>
      )}

      {/* Certificate Detail Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Detalhes do Certificado</h2>
              <button
                onClick={() => setSelectedCertificate(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Informações do Serviço</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Serviço:</strong> {selectedCertificate.service}</div>
                      <div><strong>Unidade:</strong> {selectedCertificate.unit}</div>
                      <div><strong>Responsável:</strong> {selectedCertificate.responsible}</div>
                      <div><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedCertificate.status)}`}>{selectedCertificate.status}</span></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Datas</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Executado em:</strong> {formatDate(selectedCertificate.executedDate)}</div>
                      <div><strong>Vencimento:</strong> <span className={getExpiryColor(selectedCertificate.expiryDate)}>{formatDate(selectedCertificate.expiryDate)}</span></div>
                      <div><strong>Última atualização:</strong> {formatDate(selectedCertificate.lastUpdate)}</div>
                      <div><strong>Criado em:</strong> {formatDate(selectedCertificate.createdAt)}</div>
                    </div>
                  </div>
                </div>
                
                {selectedCertificate.currentCertificate && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Certificado</h3>
                    <div className="flex items-center space-x-2">
                      <FileCheck size={16} className="text-acasa-purple" />
                      <a 
                        href={selectedCertificate.currentCertificate} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-acasa-purple hover:underline text-sm"
                      >
                        Visualizar certificado atual
                      </a>
                      <Download size={14} className="text-gray-400" />
                    </div>
                  </div>
                )}

                {selectedCertificate.observations && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Observações</h3>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedCertificate.observations}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedCertificate(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  onEditCertificate(selectedCertificate);
                  setSelectedCertificate(null);
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