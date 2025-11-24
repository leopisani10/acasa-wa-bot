import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Users, AlertTriangle, Building2, Filter, Upload } from 'lucide-react';
import { useEmployees } from '../../contexts/EmployeeContext';
import { Employee } from '../../types';
import { EmployeeImport } from './EmployeeImport';

interface EmployeeListProps {
  onAddEmployee: () => void;
  onEditEmployee: (employee: Employee) => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({ onAddEmployee, onEditEmployee }) => {
  const { employees, deleteEmployee, getExpiringItems, loading, error } = useEmployees();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<'none' | 'unit' | 'employmentType'>('none');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showImport, setShowImport] = useState(false);

  const expiringItems = getExpiringItems();

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.cpf.includes(searchTerm) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    const matchesEmploymentType = employmentTypeFilter === 'all' || employee.employmentType === employmentTypeFilter;
    const matchesUnit = unitFilter === 'all' || employee.unit === unitFilter;
    return matchesSearch && matchesStatus && matchesEmploymentType && matchesUnit;
  });

  const groupedEmployees = () => {
    if (groupBy === 'none') {
      return { 'Todos': filteredEmployees };
    }
    
    const grouped: Record<string, Employee[]> = {};
    filteredEmployees.forEach(employee => {
      const key = groupBy === 'unit' ? employee.unit : employee.employmentType;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(employee);
    });
    
    return grouped;
  };

  const handleDelete = (employee: Employee) => {
    if (window.confirm(`Tem certeza que deseja excluir o colaborador ${employee.fullName}?`)) {
      deleteEmployee(employee.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-100 text-green-700';
      case 'Inativo': return 'bg-red-100 text-red-700';
      case 'Afastado': return 'bg-yellow-100 text-yellow-700';
      case 'Férias': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getEmploymentTypeColor = (type: string) => {
    switch (type) {
      case 'CLT': return 'bg-purple-100 text-acasa-purple';
      case 'Contrato': return 'bg-blue-100 text-blue-700';
      case 'Terceirizado': return 'bg-orange-100 text-orange-700';
      case 'Estágio': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const grouped = groupedEmployees();

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Colaboradores</h2>
            <p className="text-gray-600">Carregando colaboradores...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-acasa-purple"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Colaboradores</h2>
            <p className="text-gray-600">Erro ao carregar dados</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-2">
            <AlertTriangle className="text-red-600 mr-2" size={20} />
            <h3 className="text-lg font-medium text-red-800">Erro de Conexão</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Colaboradores</h2>
          <p className="text-gray-600">Gerencie os colaboradores da ACASA</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload size={20} className="mr-2" />
            Importar Planilha
          </button>
          <button
            onClick={onAddEmployee}
            className="flex items-center px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Novo Colaborador
          </button>
        </div>
      </div>

      {/* Alertas de Vencimento */}
      {expiringItems.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertTriangle className="text-orange-600 mr-2" size={20} />
            <h3 className="text-lg font-medium text-orange-800">
              {expiringItems.length} item(s) vencendo nos próximos 30 dias
            </h3>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {expiringItems.slice(0, 5).map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-orange-700">
                  <strong>{item.employeeName}</strong> - {item.description}
                </span>
                <span className="text-orange-600 font-medium">
                  {item.daysUntilExpiry} dias
                </span>
              </div>
            ))}
            {expiringItems.length > 5 && (
              <p className="text-sm text-orange-600">
                +{expiringItems.length - 5} itens adicionais vencendo
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar colaboradores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
        >
          <option value="all">Todos os Status</option>
          <option value="Ativo">Ativo</option>
          <option value="Inativo">Inativo</option>
          <option value="Afastado">Afastado</option>
          <option value="Férias">Férias</option>
        </select>
        <select
          value={employmentTypeFilter}
          onChange={(e) => setEmploymentTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
        >
          <option value="all">Todos os Vínculos</option>
          <option value="CLT">CLT</option>
          <option value="Contrato">Contrato</option>
          <option value="Terceirizado">Terceirizado</option>
          <option value="Estágio">Estágio</option>
          <option value="Outro">Outro</option>
        </select>
        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
        >
          <option value="all">Todas as Unidades</option>
          <option value="Botafogo">Botafogo</option>
        </select>
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as 'none' | 'unit' | 'employmentType')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
        >
          <option value="none">Sem Agrupamento</option>
          <option value="unit">Agrupar por Unidade</option>
          <option value="employmentType">Agrupar por Vínculo</option>
        </select>
        <div className="flex items-center text-sm text-gray-600">
          <Filter size={16} className="mr-1" />
          {filteredEmployees.length} de {employees.length}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
            <Users className="text-acasa-purple" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Ativos</p>
              <p className="text-2xl font-bold text-gray-900">
                {employees.filter(e => e.status === 'Ativo').length}
              </p>
            </div>
            <Users className="text-green-600" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">CLT</p>
              <p className="text-2xl font-bold text-gray-900">
                {employees.filter(e => e.employmentType === 'CLT').length}
              </p>
            </div>
            <Building2 className="text-acasa-purple" size={20} />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Vencimentos</p>
              <p className="text-2xl font-bold text-gray-900">{expiringItems.length}</p>
            </div>
            <AlertTriangle className="text-orange-600" size={20} />
          </div>
        </div>
      </div>

      {/* Employee Groups */}
      {Object.entries(grouped).map(([groupName, groupEmployees]) => (
        <div key={groupName}>
          {groupBy !== 'none' && (
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              {groupName} ({groupEmployees.length})
            </h3>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupEmployees.map((employee) => (
              <div key={employee.id} className="bg-white rounded-lg border border-gray-100 hover:border-acasa-purple transition-all duration-200">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 mb-1 font-sans">{employee.fullName}</h3>
                      <div className="text-sm text-gray-500 space-y-0.5 font-sans">
                        <div className="font-sans">{employee.position} • {employee.unit}</div>
                        <div className="font-sans">{calculateAge(employee.birthDate)} anos</div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full font-sans ${getStatusColor(employee.status)}`}>
                        {employee.status}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full font-sans ${getEmploymentTypeColor(employee.employmentType)}`}>
                        {employee.employmentType}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-gray-500 mb-4 border-t border-gray-50 pt-3 font-sans">
                    <div>
                      <span className="text-gray-400 font-sans">CPF:</span> <span className="font-mono font-sans">{employee.cpf}</span>
                    </div>
                    {employee.professionalLicense?.council !== 'Não Possui' && (
                      <div>
                        <span className="text-gray-400 font-sans">Conselho:</span> <span className="font-sans">{employee.professionalLicense?.council}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400 font-sans">Vacinas COVID:</span> <span className="font-sans">{employee.covidVaccines.length}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 pt-3 border-t border-gray-50">
                    <button
                      onClick={() => setSelectedEmployee(employee)}
                      className="flex-1 text-center py-2 text-acasa-purple hover:bg-gray-50 rounded transition-colors text-sm font-medium font-sans"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => onEditEmployee(employee)}
                      className="flex-1 text-center py-2 text-green-600 hover:bg-gray-50 rounded transition-colors text-sm font-medium font-sans"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(employee)}
                      className="p-2 text-red-600 hover:bg-gray-50 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum colaborador encontrado</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all' || employmentTypeFilter !== 'all'
              ? 'Tente ajustar os filtros de busca.'
              : 'Comece adicionando o primeiro colaborador.'}
          </p>
          {!searchTerm && statusFilter === 'all' && employmentTypeFilter === 'all' && (
            <button
              onClick={onAddEmployee}
              className="inline-flex items-center px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors"
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Detalhes do Colaborador</h2>
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
                      <div><strong>RG:</strong> {selectedEmployee.rg}</div>
                      <div><strong>Idade:</strong> {calculateAge(selectedEmployee.birthDate)} anos</div>
                      <div><strong>Endereço:</strong> {selectedEmployee.address}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Informações Profissionais</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Cargo:</strong> {selectedEmployee.position}</div>
                      <div><strong>Unidade:</strong> {selectedEmployee.unit}</div>
                      <div><strong>Vínculo:</strong> {selectedEmployee.employmentType}</div>
                      <div><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedEmployee.status)}`}>{selectedEmployee.status}</span></div>
                      {selectedEmployee.professionalLicense && (
                        <div><strong>Carteira:</strong> {selectedEmployee.professionalLicense.council} - {selectedEmployee.professionalLicense.licenseNumber}</div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedEmployee.covidVaccines.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Vacinas COVID</h3>
                    <div className="space-y-2">
                      {selectedEmployee.covidVaccines.map((vaccine) => (
                        <div key={vaccine.id} className="bg-gray-50 p-3 rounded-lg text-sm">
                          <div className="flex justify-between">
                            <strong>{vaccine.dose} - {vaccine.vaccineType}</strong>
                            <span>{formatDate(vaccine.applicationDate)}</span>
                          </div>
                          {vaccine.notes && <div className="text-gray-600 mt-1">{vaccine.notes}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                className="flex items-center px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Edit size={16} className="mr-2" />
                Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <EmployeeImport
          onClose={() => setShowImport(false)}
          onImported={() => {
            setShowImport(false);
            // Força atualização da lista
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};