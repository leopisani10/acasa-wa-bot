import React, { useState } from 'react';
import { Plus, Search, Filter, Phone, MapPin, User, Calendar, Eye, Edit, Trash2, UserPlus } from 'lucide-react';
import { useCRM } from '../../contexts/CRMContext';
import { useAuth } from '../../contexts/AuthContext';
import { Lead, LeadFilters } from '../../types/crm';
import { getStageConfig, formatPhone } from '../../types/crm';
import { LeadFormModal } from './LeadFormModal';
import { LeadDrawer } from './LeadDrawer';

export const LeadsList: React.FC = () => {
  const { 
    filteredLeads, 
    leads, 
    units, 
    deleteLead, 
    setFilters, 
    filters, 
    loading 
  } = useCRM();
  const { user } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Get unique owners for filter
  const owners = Array.from(new Set(leads.map(lead => lead.owner).filter(Boolean)));

  const handleFilterChange = (filterData: Partial<LeadFilters>) => {
    const newFilters = { ...filters, ...filterData };
    setFilters(newFilters);
  };

  const handleDelete = async (lead: Lead) => {
    if (window.confirm(`Tem certeza que deseja excluir o lead de ${lead.contact?.full_name}?`)) {
      try {
        await deleteLead(lead.id);
      } catch (error) {
        alert('Erro ao excluir lead');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leads Comerciais</h2>
          <p className="text-gray-600">Gerencie leads e oportunidades de negócio</p>
        </div>
        <button
          onClick={() => {
            setEditingLead(null);
            setShowForm(true);
          }}
          className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Novo Lead
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleFilterChange({ search: e.target.value });
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filters.stage || ''}
            onChange={(e) => handleFilterChange({ stage: e.target.value as any || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os Estágios</option>
            <option value="Novo">Novo</option>
            <option value="Qualificando">Qualificando</option>
            <option value="Agendou visita">Agendou visita</option>
            <option value="Visitou">Visitou</option>
            <option value="Proposta">Proposta</option>
            <option value="Fechado">Fechado</option>
            <option value="Perdido">Perdido</option>
          </select>

          <select
            value={filters.unit_id || ''}
            onChange={(e) => handleFilterChange({ unit_id: e.target.value || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as Unidades</option>
            {units.map(unit => (
              <option key={unit.id} value={unit.id}>{unit.name}</option>
            ))}
          </select>

          <select
            value={filters.owner_id || ''}
            onChange={(e) => handleFilterChange({ owner_id: e.target.value || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os Responsáveis</option>
            {owners.map(owner => (
              <option key={owner?.id} value={owner?.id}>{owner?.name}</option>
            ))}
          </select>

          <div className="flex items-center text-sm text-gray-600">
            <Filter size={16} className="mr-1" />
            {filteredLeads.length} de {leads.length} leads
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
            </div>
            <UserPlus className="text-blue-600" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Novos</p>
              <p className="text-2xl font-bold text-gray-900">
                {leads.filter(l => l.stage === 'Novo').length}
              </p>
            </div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Qualificando</p>
              <p className="text-2xl font-bold text-gray-900">
                {leads.filter(l => l.stage === 'Qualificando').length}
              </p>
            </div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Fechados</p>
              <p className="text-2xl font-bold text-gray-900">
                {leads.filter(l => l.stage === 'Fechado').length}
              </p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Perdidos</p>
              <p className="text-2xl font-bold text-gray-900">
                {leads.filter(l => l.stage === 'Perdido').length}
              </p>
            </div>
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Contato</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Telefone</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Estágio</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Unidade</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Responsável</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Idoso</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Criado</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLeads.map((lead) => {
                const stageConfig = getStageConfig(lead.stage);
                return (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {lead.contact?.full_name || 'Nome não informado'}
                        </div>
                        {lead.contact?.relation && (
                          <div className="text-sm text-gray-600">
                            {lead.contact.relation}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Phone size={16} className="mr-2 text-gray-400" />
                        <span className="font-mono text-sm">
                          {formatPhone(lead.contact?.phone || '')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${stageConfig.bgColor} ${stageConfig.textColor}`}>
                        {stageConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <MapPin size={16} className="mr-2 text-gray-400" />
                        <span className="text-sm">
                          {lead.contact?.unit?.name || 'Não definido'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <User size={16} className="mr-2 text-gray-400" />
                        <span className="text-sm">
                          {lead.owner?.name || 'Não atribuído'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {lead.elderly_name || 'Não informado'}
                        </div>
                        {lead.elderly_age && (
                          <div className="text-sm text-gray-600">
                            {lead.elderly_age} anos
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-2 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatDate(lead.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingLead(lead);
                            setShowForm(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(lead)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <UserPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum lead encontrado</h3>
            <p className="text-gray-600 mb-4">
              {Object.keys(filters).length > 0
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando seu primeiro lead.'}
            </p>
            {Object.keys(filters).length === 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} className="mr-2" />
                Criar Primeiro Lead
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lead Form Modal */}
      {showForm && (
        <LeadFormModal
          lead={editingLead}
          onClose={() => {
            setShowForm(false);
            setEditingLead(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingLead(null);
          }}
        />
      )}

      {/* Lead Drawer */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onEdit={(lead) => {
            setSelectedLead(null);
            setEditingLead(lead);
            setShowForm(true);
          }}
        />
      )}
    </div>
  );
};