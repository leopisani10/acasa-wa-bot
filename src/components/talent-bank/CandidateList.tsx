import React, { useState } from 'react';
import { Plus, Search, Filter, Phone, Mail, User, Calendar, Eye, Edit, Trash2, UserPlus, MapPin, Building } from 'lucide-react';
import { useTalentBank } from '../../contexts/TalentBankContext';
import { useAuth } from '../../contexts/AuthContext';
import { Candidate, CandidateFilters } from '../../types/talentBank';
import { getStatusConfig, formatCandidatePhone, calculateDaysInPipeline } from '../../types/talentBank';
import { CandidateFormModal } from './CandidateFormModal';
import { CandidateDrawer } from './CandidateDrawer';

export const CandidateList: React.FC = () => {
  const { 
    filteredCandidates, 
    candidates, 
    deleteCandidate, 
    setFilters, 
    filters, 
    loading 
  } = useTalentBank();
  const { user } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Get unique positions and cities for filters
  const positions = Array.from(new Set(candidates.map(c => c.desired_position).filter(Boolean)));
  const cities = Array.from(new Set(candidates.map(c => c.city).filter(Boolean)));

  const handleFilterChange = (filterData: Partial<CandidateFilters>) => {
    const newFilters = { ...filters, ...filterData };
    setFilters(newFilters);
  };

  const handleDelete = async (candidate: Candidate) => {
    if (window.confirm(`Tem certeza que deseja excluir o candidato ${candidate.full_name}?`)) {
      try {
        await deleteCandidate(candidate.id);
      } catch (error) {
        alert('Erro ao excluir candidato');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Banco de Talentos</h2>
          <p className="text-gray-600">Gerencie candidatos e processos seletivos</p>
        </div>
        <button
          onClick={() => {
      <div className="text-center py-12 max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
            <Database className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Configuração Necessária
          </h3>
          <p className="text-yellow-700 mb-4 leading-relaxed">
            {error}
          </p>
          <div className="bg-white rounded-lg p-4 mb-4 text-left">
            <h4 className="font-semibold text-gray-800 mb-2">📋 Passos para ativar:</h4>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Acesse seu projeto no Supabase</li>
              <li>2. Vá para "SQL Editor"</li>
              <li>3. Execute a migração "create_talent_bank_tables.sql"</li>
              <li>4. Recarregue esta página</li>
            </ol>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleFilterChange({ search: e.target.value });
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange({ status: e.target.value as any || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Todos os Status</option>
            <option value="Novo">Novo</option>
            <option value="Triagem">Triagem</option>
            <option value="Entrevista Agendada">Entrevista Agendada</option>
            <option value="Entrevistado">Entrevistado</option>
            <option value="Aprovado">Aprovado</option>
            <option value="Contratado">Contratado</option>
            <option value="Rejeitado">Rejeitado</option>
            <option value="Inativo">Inativo</option>
          </select>

          <select
            value={filters.desired_position || ''}
            onChange={(e) => handleFilterChange({ desired_position: e.target.value || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Todos os Cargos</option>
            {positions.map(position => (
              <option key={position} value={position}>{position}</option>
            ))}
          </select>

          <select
            value={filters.city || ''}
            onChange={(e) => handleFilterChange({ city: e.target.value || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Todas as Cidades</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select
            value={filters.source || ''}
            onChange={(e) => handleFilterChange({ source: e.target.value as any || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Todas as Origens</option>
            <option value="Site/Formulário">Site/Formulário</option>
            <option value="Indicação">Indicação</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Email">Email</option>
            <option value="Presencial">Presencial</option>
            <option value="Outro">Outro</option>
          </select>

          <div className="flex items-center text-sm text-gray-600">
            <Filter size={16} className="mr-1" />
            {filteredCandidates.length} de {candidates.length} candidatos
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-gray-900">{candidates.length}</p>
            </div>
            <UserPlus className="text-green-600" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Novos</p>
              <p className="text-2xl font-bold text-gray-900">
                {candidates.filter(c => c.status === 'Novo').length}
              </p>
            </div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Entrevistas</p>
              <p className="text-2xl font-bold text-gray-900">
                {candidates.filter(c => c.status === 'Entrevista Agendada' || c.status === 'Entrevistado').length}
              </p>
            </div>
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Contratados</p>
              <p className="text-2xl font-bold text-gray-900">
                {candidates.filter(c => c.status === 'Contratado').length}
              </p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Este Mês</p>
              <p className="text-2xl font-bold text-gray-900">
                {candidates.filter(c => {
                  const created = new Date(c.created_at);
                  const now = new Date();
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <Calendar className="text-blue-600" size={20} />
          </div>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Candidato</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Contato</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Cargo Desejado</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Localização</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Experiência</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Criado</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCandidates.map((candidate) => {
                const statusConfig = getStatusConfig(candidate.status);
                const daysInPipeline = calculateDaysInPipeline(candidate.created_at);
                return (
                  <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          {candidate.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {candidate.full_name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {daysInPipeline} dias no pipeline
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Phone size={14} className="mr-2 text-gray-400" />
                          <span className="font-mono">{formatCandidatePhone(candidate.phone)}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Mail size={14} className="mr-2 text-gray-400" />
                          <span className="text-gray-600">{candidate.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Building size={16} className="mr-2 text-gray-400" />
                        <span className="text-sm font-medium">{candidate.desired_position}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <MapPin size={16} className="mr-2 text-gray-400" />
                        <span className="text-sm">
                          {candidate.city}, {candidate.state}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {candidate.experience_years} anos
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-2 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatDate(candidate.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => setSelectedCandidate(candidate)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCandidate(candidate);
                            setShowForm(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <a
                          href={`tel:${candidate.phone}`}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Ligar"
                        >
                          <Phone size={16} />
                        </a>
                        <a
                          href={`mailto:${candidate.email}`}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Enviar email"
                        >
                          <Mail size={16} />
                        </a>
                        <button
                          onClick={() => handleDelete(candidate)}
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

        {filteredCandidates.length === 0 && (
          <div className="text-center py-12">
            <UserPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum candidato encontrado</h3>
            <p className="text-gray-600 mb-4">
              {Object.keys(filters).length > 0
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando seu primeiro candidato.'}
            </p>
            {Object.keys(filters).length === 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus size={20} className="mr-2" />
                Criar Primeiro Candidato
              </button>
            )}
          </div>
        )}
      </div>

      {/* Candidate Form Modal */}
      {showForm && (
        <CandidateFormModal
          candidate={editingCandidate}
          onClose={() => {
            setShowForm(false);
            setEditingCandidate(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingCandidate(null);
          }}
        />
      )}

      {/* Candidate Drawer */}
      {selectedCandidate && (
        <CandidateDrawer
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onEdit={(candidate) => {
            setSelectedCandidate(null);
            setEditingCandidate(candidate);
            setShowForm(true);
          }}
        />
      )}
    </div>
  );
};