import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, CheckCircle, AlertCircle, Clock, Scale } from 'lucide-react';
import { useLaborAgreements } from '../../contexts/LaborAgreementContext';
import { LaborAgreementWithInstallments } from '../../types';

interface LaborAgreementListProps {
  onAddAgreement: () => void;
  onViewAgreement: (agreement: LaborAgreementWithInstallments) => void;
  onEditAgreement: (agreement: LaborAgreementWithInstallments) => void;
}

export const LaborAgreementList: React.FC<LaborAgreementListProps> = ({
  onAddAgreement,
  onViewAgreement,
  onEditAgreement,
}) => {
  const { agreements, loading, deleteAgreement, getStatistics } = useLaborAgreements();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const statistics = getStatistics();

  const getAgreementStatus = (agreement: LaborAgreementWithInstallments) => {
    const totalInstallments = agreement.installments.length;
    const paidInstallments = agreement.installments.filter(i => i.paymentStatus === 'paid').length;
    const overdueInstallments = agreement.installments.filter(i => i.paymentStatus === 'overdue').length;

    if (paidInstallments === totalInstallments) return 'completed';
    if (overdueInstallments > 0) return 'overdue';
    return 'active';
  };

  const filteredAgreements = useMemo(() => {
    return agreements.filter(agreement => {
      const matchesSearch =
        agreement.claimantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agreement.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agreement.processNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agreement.lawyerFullName.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (filterStatus === 'all') return true;

      const status = getAgreementStatus(agreement);
      return status === filterStatus;
    });
  }, [agreements, searchTerm, filterStatus]);

  const handleDelete = async (id: string) => {
    try {
      await deleteAgreement(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting agreement:', error);
      alert('Erro ao excluir acordo. Verifique se há parcelas pagas.');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (agreement: LaborAgreementWithInstallments) => {
    const status = getAgreementStatus(agreement);
    const paidCount = agreement.installments.filter(i => i.paymentStatus === 'paid').length;
    const totalCount = agreement.installments.length;

    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          Quitado
        </span>
      );
    }

    if (status === 'overdue') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3" />
          Em Atraso
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3" />
        Em Dia ({paidCount}/{totalCount} pagas)
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Scale className="w-8 h-8 text-blue-600" />
            Acordos Trabalhistas
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie acordos trabalhistas e controle de parcelas
          </p>
        </div>
        <button
          onClick={onAddAgreement}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Acordo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Acordos</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalAgreements}</p>
            </div>
            <Scale className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Parcelas Vencidas</p>
              <p className="text-2xl font-bold text-red-600">{statistics.overdueInstallments}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Próximos 7 Dias</p>
              <p className="text-2xl font-bold text-yellow-600">{statistics.upcomingInstallments}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pendente</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(statistics.totalPendingAmount)}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por reclamante, empresa, processo ou advogado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="active">Em Dia</option>
                <option value="overdue">Em Atraso</option>
                <option value="completed">Quitados</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredAgreements.length === 0 ? (
            <div className="text-center py-12">
              <Scale className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {searchTerm || filterStatus !== 'all'
                  ? 'Nenhum acordo encontrado'
                  : 'Nenhum acordo cadastrado'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={onAddAgreement}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Cadastrar Primeiro Acordo
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAgreements.map((agreement) => {
                const paidCount = agreement.installments.filter(i => i.paymentStatus === 'paid').length;
                const totalCount = agreement.installments.length;
                const paidAmount = agreement.installments
                  .filter(i => i.paymentStatus === 'paid')
                  .reduce((sum, i) => sum + i.amount, 0);

                return (
                  <div key={agreement.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {agreement.claimantName} <span className="text-gray-400">vs</span> {agreement.companyName}
                            </h3>

                            <div className="mt-2 space-y-1">
                              {agreement.processNumber && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Processo:</span> {agreement.processNumber}
                                </p>
                              )}
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Advogado:</span> {agreement.lawyerFullName}
                              </p>
                              {(agreement.laborCourt || agreement.jurisdiction) && (
                                <p className="text-sm text-gray-600">
                                  {agreement.laborCourt && <span>{agreement.laborCourt}</span>}
                                  {agreement.laborCourt && agreement.jurisdiction && <span> • </span>}
                                  {agreement.jurisdiction && <span>{agreement.jurisdiction}</span>}
                                </p>
                              )}
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-4">
                              <div>
                                <p className="text-xs text-gray-500">Valor Total</p>
                                <p className="text-lg font-bold text-gray-900">{formatCurrency(agreement.totalAmount)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Pago</p>
                                <p className="text-lg font-semibold text-green-600">{formatCurrency(paidAmount)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Parcelas</p>
                                <p className="text-lg font-semibold text-gray-700">{paidCount}/{totalCount}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        {getStatusBadge(agreement)}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onViewAgreement(agreement)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => onEditAgreement(agreement)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          {deleteConfirm === agreement.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDelete(agreement.id)}
                                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(agreement.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
