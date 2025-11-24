import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Users, Phone, MapPin } from 'lucide-react';
import { useSobreaviso } from '../../contexts/SobreavisoContext';
import { SobreavisoEmployee } from '../../types';

interface SobreavisoListProps {
  onAddEmployee: () => void;
  onEditEmployee: (employee: SobreavisoEmployee) => void;
}

export const SobreavisoList: React.FC<SobreavisoListProps> = ({ onAddEmployee, onEditEmployee }) => {
  const { sobreavisoEmployees, deleteSobreavisoEmployee } = useSobreaviso();
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<SobreavisoEmployee | null>(null);

  const filteredEmployees = sobreavisoEmployees.filter(employee => {
    const matchesSearch = employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.cpf.includes(searchTerm) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit = unitFilter === 'all' || employee.unit === unitFilter;
    return matchesSearch && matchesUnit;
  });

  const handleDelete = (employee: SobreavisoEmployee) => {
    if (window.confirm(`Tem certeza que deseja excluir ${employee.fullName} do sobreaviso?`)) {
      deleteSobreavisoEmployee(employee.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-100 text-green-700';
      case 'Inativo': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getUnitColor = (unit: string) => {
    switch (unit) {
      case 'Botafogo': return 'bg-blue-100 text-blue-700';
      case 'Ambas': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-orange-600 p-4 rounded-full">
            <Users className="text-white" size={32} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Colaboradores de Sobreaviso</h1>
        <p className="text-gray-600">Gerencie colaboradores disponíveis para substituições e coberturas</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Equipe de Sobreaviso</h2>
          <p className="text-gray-600">Profissionais disponíveis para cobrir faltas e emergências</p>
        </div>
        <button
          onClick={onAddEmployee}
          className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Novo Colaborador
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="all">Todas as Unidades</option>
          <option value="Botafogo">Botafogo</option>
          <option value="Ambas">Ambas</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-gray-900">{sobreavisoEmployees.length}</p>
            </div>
            <Users className="text-orange-600" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Ativos</p>
              <p className="text-2xl font-bold text-gray-900">
                {sobreavisoEmployees.filter(e => e.status === 'Ativo').length}
              </p>
            </div>
            <Users className="text-green-600" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Para Ambas</p>
              <p className="text-2xl font-bold text-gray-900">
                {sobreavisoEmployees.filter(e => e.unit === 'Ambas' && e.status === 'Ativo').length}
              </p>
            </div>
            <MapPin className="text-orange-600" size={20} />
          </div>
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="bg-white rounded-lg border border-gray-100 hover:border-orange-500 hover:shadow-lg transition-all duration-300">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{employee.fullName}</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center">
                      <Users size={16} className="mr-2 text-orange-600" />
                      <span className="font-medium">{employee.position}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone size={16} className="mr-2 text-orange-600" />
                      <span>{employee.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(employee.status)}`}>
                    {employee.status}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUnitColor(employee.unit)}`}>
                    {employee.unit}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">CPF:</span> 
                    <span className="font-mono font-bold text-gray-900">{employee.cpf}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Disponível para:</span>
                    <span className="font-medium text-orange-600">{employee.unit}</span>
                  </div>
                  {employee.pix && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">PIX:</span>
                      <span className="font-mono text-gray-900 text-xs">{employee.pix}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedEmployee(employee)}
                  className="flex-1 text-center py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors text-sm font-medium border border-orange-600"
                >
                  Ver
                </button>
                <button
                  onClick={() => onEditEmployee(employee)}
                  className="flex-1 text-center py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm font-medium border border-green-600"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(employee)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum colaborador de sobreaviso encontrado</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || unitFilter !== 'all'
              ? 'Tente ajustar os filtros de busca.'
              : 'Comece adicionando o primeiro colaborador de sobreaviso.'}
          </p>
          {!searchTerm && unitFilter === 'all' && (
            <button
              onClick={onAddEmployee}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Adicionar Colaborador
            </button>
          )}
        </div>
      )}

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Detalhes - Sobreaviso</h2>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Informações Pessoais</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Nome:</strong> {selectedEmployee.fullName}</div>
                      <div><strong>CPF:</strong> {selectedEmployee.cpf}</div>
                      <div><strong>Cargo:</strong> {selectedEmployee.position}</div>
                      <div><strong>Telefone:</strong> {selectedEmployee.phone}</div>
                      <div><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedEmployee.status)}`}>{selectedEmployee.status}</span></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Disponibilidade</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Unidade(s):</strong> <span className={`px-2 py-1 rounded text-xs ${getUnitColor(selectedEmployee.unit)}`}>{selectedEmployee.unit}</span></div>
                      <div><strong>Criado em:</strong> {new Date(selectedEmployee.createdAt).toLocaleDateString('pt-BR')}</div>
                      <div><strong>Atualizado em:</strong> {new Date(selectedEmployee.updatedAt).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>
                </div>

                {selectedEmployee.observations && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Observações</h3>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedEmployee.observations}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  onEditEmployee(selectedEmployee);
                  setSelectedEmployee(null);
                }}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
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