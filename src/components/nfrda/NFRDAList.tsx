import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, FileText, DollarSign, Clock, AlertTriangle, Filter, Download } from 'lucide-react';
import { useNFRDA } from '../../contexts/NFRDAContext';
import { useEmployees } from '../../contexts/EmployeeContext';
import { NFRDAEntry } from '../../types';

interface NFRDAListProps {
  onAddEntry: () => void;
  onEditEntry: (entry: NFRDAEntry) => void;
}

export const NFRDAList: React.FC<NFRDAListProps> = ({ onAddEntry, onEditEntry }) => {
  const { entries, deleteEntry, getPendingEntries } = useNFRDA();
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<NFRDAEntry | null>(null);

  const pendingEntries = getPendingEntries();

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.contractorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit = unitFilter === 'all' || entry.unit === unitFilter;
    const matchesStatus = statusFilter === 'all' || entry.deliveryStatus === statusFilter;
    const matchesMonth = monthFilter === 'all' || entry.referenceMonth.toString() === monthFilter;
    return matchesSearch && matchesUnit && matchesStatus && matchesMonth;
  });

  const handleDelete = (entry: NFRDAEntry) => {
    if (window.confirm(`Tem certeza que deseja excluir a entrada de ${entry.contractorName}?`)) {
      deleteEntry(entry.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatMonth = (month: number, year: number) => {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[month - 1]} ${year}`;
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'Sim': return 'bg-green-100 text-green-700';
      case 'Aguardando NF/RDA': return 'bg-blue-100 text-blue-700';
      case 'Não': return 'bg-red-100 text-red-700';
      case 'Desconto': return 'bg-orange-100 text-orange-700';
      case 'Congelado': return 'bg-gray-100 text-gray-700';
      case 'Erro': return 'bg-red-100 text-red-700';
      case 'Sumiu': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Sim': return 'bg-green-100 text-green-700';
      case 'Não': return 'bg-red-100 text-red-700';
      case 'Parcial': return 'bg-yellow-100 text-yellow-700';
      case 'Congelado': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">NF + RDA</h2>
          <p className="text-gray-600">Gerencie notas fiscais e relatórios de atividade</p>
        </div>
        <button
          onClick={onAddEntry}
          className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Nova Entrada
        </button>
      </div>

      {/* Alertas de Pendências */}
      {pendingEntries.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertTriangle className="text-orange-600 mr-2" size={20} />
            <h3 className="text-lg font-medium text-orange-800">
              {pendingEntries.length} entrada(s) pendente(s)
            </h3>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {pendingEntries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex justify-between items-center text-sm">
                <span className="text-orange-700">
                  <strong>{entry.contractorName}</strong> - {formatMonth(entry.referenceMonth, entry.referenceYear)} ({entry.unit})
                </span>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getDeliveryStatusColor(entry.deliveryStatus)}`}>
                    {entry.deliveryStatus}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(entry.paymentStatus)}`}>
                    {entry.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
            {pendingEntries.length > 5 && (
              <p className="text-sm text-orange-600">
                +{pendingEntries.length - 5} entradas adicionais pendentes
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
            placeholder="Buscar contratado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
          />
        </div>
        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
        >
          <option value="all">Todas as Unidades</option>
          <option value="Botafogo">Botafogo</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
        >
          <option value="all">Todos os Status</option>
          <option value="Aguardando NF/RDA">Aguardando NF/RDA</option>
          <option value="Sim">Sim</option>
          <option value="Não">Não</option>
          <option value="Desconto">Desconto</option>
          <option value="Congelado">Congelado</option>
          <option value="Erro">Erro</option>
          <option value="Sumiu">Sumiu</option>
        </select>
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
        >
          <option value="all">Todos os Meses</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
            <option key={month} value={month.toString()}>
              {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][month - 1]}
            </option>
          ))}
        </select>
        <div className="flex items-center text-sm text-gray-600">
          <Filter size={16} className="mr-1" />
          {filteredEntries.length} de {entries.length}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
            </div>
            <FileText className="text-acasa-purple" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Entregues</p>
              <p className="text-2xl font-bold text-gray-900">
                {entries.filter(e => e.deliveryStatus === 'Sim').length}
              </p>
            </div>
            <FileText className="text-green-600" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Pagos</p>
              <p className="text-2xl font-bold text-gray-900">
                {entries.filter(e => e.paymentStatus === 'Sim').length}
              </p>
            </div>
            <DollarSign className="text-green-600" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{pendingEntries.length}</p>
            </div>
            <Clock className="text-orange-600" size={20} />
          </div>
        </div>
      </div>

      {/* Entry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEntries.map((entry) => (
          <div key={entry.id} className="bg-white rounded-lg border border-gray-100 hover:border-acasa-purple transition-all duration-200">
            <div className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 mb-1 font-sans">{entry.contractorName}</h3>
                  <div className="text-sm text-gray-500 space-y-0.5 font-sans">
                    <div className="font-sans">{entry.unit}</div>
                    <div className="font-sans">{formatMonth(entry.referenceMonth, entry.referenceYear)}</div>
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full font-sans ${getDeliveryStatusColor(entry.deliveryStatus)}`}>
                    {entry.deliveryStatus}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full font-sans ${getPaymentStatusColor(entry.paymentStatus)}`}>
                    Pago: {entry.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-sm text-gray-500 mb-4 border-t border-gray-50 pt-3 font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-sans">RDA:</span>
                  <span className={`font-sans ${entry.activityReportUpload ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.activityReportUpload ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-sans">NF:</span>
                  <span className={`font-sans ${entry.invoiceUpload ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.invoiceUpload ? '✓' : '✗'}
                  </span>
                </div>
                {entry.paymentDate && (
                  <div>
                    <span className="text-gray-400 font-sans">Pagamento:</span> <span className="font-sans">{formatDate(entry.paymentDate)}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-400 font-sans">Atualização:</span> <span className="font-sans">{formatDate(entry.lastUpdate)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-1 pt-3 border-t border-gray-50">
                <button
                  onClick={() => setSelectedEntry(entry)}
                  className="flex-1 text-center py-2 text-acasa-purple hover:bg-gray-50 rounded transition-colors text-sm font-medium font-sans"
                >
                  Ver
                </button>
                <button
                  onClick={() => onEditEntry(entry)}
                  className="flex-1 text-center py-2 text-green-600 hover:bg-gray-50 rounded transition-colors text-sm font-medium font-sans"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(entry)}
                  className="p-2 text-red-600 hover:bg-gray-50 rounded transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEntries.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma entrada encontrada</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || unitFilter !== 'all' || statusFilter !== 'all'
              ? 'Tente ajustar os filtros de busca.'
              : 'Comece adicionando a primeira entrada.'}
          </p>
          {!searchTerm && unitFilter === 'all' && statusFilter === 'all' && (
            <button
              onClick={onAddEntry}
              className="inline-flex items-center px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Adicionar Entrada
            </button>
          )}
        </div>
      )}

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Detalhes da Entrada</h2>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Informações Gerais</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Contratado:</strong> {selectedEntry.contractorName}</div>
                      <div><strong>Unidade:</strong> {selectedEntry.unit}</div>
                      <div><strong>Referência:</strong> {formatMonth(selectedEntry.referenceMonth, selectedEntry.referenceYear)}</div>
                      <div><strong>Status Entrega:</strong> <span className={`px-2 py-1 rounded text-xs ${getDeliveryStatusColor(selectedEntry.deliveryStatus)}`}>{selectedEntry.deliveryStatus}</span></div>
                      <div><strong>Status Pagamento:</strong> <span className={`px-2 py-1 rounded text-xs ${getPaymentStatusColor(selectedEntry.paymentStatus)}`}>{selectedEntry.paymentStatus}</span></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Datas</h3>
                    <div className="space-y-2 text-sm">
                      {selectedEntry.paymentDate && (
                        <div><strong>Data do Pagamento:</strong> {formatDate(selectedEntry.paymentDate)}</div>
                      )}
                      <div><strong>Última Atualização:</strong> {formatDate(selectedEntry.lastUpdate)}</div>
                      <div><strong>Criado em:</strong> {formatDate(selectedEntry.createdAt)}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedEntry.activityReportUpload && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Relatório de Atividade</h3>
                      <div className="flex items-center space-x-2">
                        <FileText size={16} className="text-acasa-purple" />
                        <a 
                          href={selectedEntry.activityReportUpload} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-acasa-purple hover:underline text-sm"
                        >
                          Visualizar RDA
                        </a>
                        <Download size={14} className="text-gray-400" />
                      </div>
                    </div>
                  )}

                  {selectedEntry.invoiceUpload && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Nota Fiscal</h3>
                      <div className="flex items-center space-x-2">
                        <FileText size={16} className="text-acasa-purple" />
                        <a 
                          href={selectedEntry.invoiceUpload} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-acasa-purple hover:underline text-sm"
                        >
                          Visualizar NF
                        </a>
                        <Download size={14} className="text-gray-400" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  onEditEntry(selectedEntry);
                  setSelectedEntry(null);
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