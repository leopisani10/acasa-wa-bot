import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Trash2, UserPlus, Edit3, FileText, Plus, Users, X } from 'lucide-react';
import { useSchedule } from '../../contexts/ScheduleContext';
import { useSobreaviso } from '../../contexts/SobreavisoContext';
import { ScheduleEmployee, ShiftType, ScheduleSubstitution } from '../../types';
import { MonthlyReport } from './MonthlyReport';

interface ScheduleGridProps {
  scheduleType: 'Geral' | 'Enfermagem' | 'Nutrição';
  unit: string;
  month: number;
  year: number;
  employees: ScheduleEmployee[];
  monthNames: string[];
}

interface EmptyPosition {
  id: string;
  name: string;
  position: string;
  cpf: string;
  unit: string;
  isEmptyPosition: true;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  scheduleType,
  unit,
  month,
  year,
  employees,
  monthNames
}) => {
  const { getScheduleForMonth, getSubstitutionsForMonth, updateScheduleDay, addSubstitution, removeSubstitution, clearScheduleForMonth } = useSchedule();
  const { getSobreavisoByUnit } = useSobreaviso();
  const [scheduleData, setScheduleData] = useState<Record<string, Record<number, ShiftType | null>>>({});
  const [localSubstitutions, setLocalSubstitutions] = useState<Record<string, Record<number, ScheduleSubstitution>>>({});
  const [emptyPositions, setEmptyPositions] = useState<EmptyPosition[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showEmployeeSelection, setShowEmployeeSelection] = useState(false);
  const [showSubstituteModal, setShowSubstituteModal] = useState(false);
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{ employeeId: string; day: number } | null>(null);
  const [substituteForm, setSubstituteForm] = useState({
    substituteId: '',
    substituteName: '',
    reason: 'Substituição',
  });
  const [newPositionForm, setNewPositionForm] = useState({
    position: 'Técnico de Enfermagem',
    quantity: 1,
  });
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);

  const monthSchedules = getScheduleForMonth(scheduleType, unit, month, year);
  const monthSubstitutions = getSubstitutionsForMonth(scheduleType, unit, month, year);
  const daysInMonth = new Date(year, month, 0).getDate();
  const sobreavisoList = getSobreavisoByUnit(unit);

  // Combinar funcionários selecionados com posições vazias
  const filteredEmployees = employees.filter(emp => selectedEmployees.includes(emp.id));
  const allEmployees = [...filteredEmployees, ...emptyPositions];

  // Inicializar funcionários selecionados na primeira renderização
  useEffect(() => {
    if (selectedEmployees.length === 0 && employees.length > 0) {
      setSelectedEmployees(employees.map(emp => emp.id));
    }
  }, [employees]);
  useEffect(() => {
    // Carregar dados da escala
    const data: Record<string, Record<number, ShiftType | null>> = {};
    
    allEmployees.forEach(employee => {
      data[employee.id] = {};
      
      const employeeSchedule = monthSchedules.find(s => s.employeeId === employee.id);
      if (employeeSchedule) {
        for (let day = 1; day <= 31; day++) {
          const dayKey = `day${day}` as keyof typeof employeeSchedule;
          data[employee.id][day] = (employeeSchedule[dayKey] as ShiftType) || null;
        }
      } else {
        for (let day = 1; day <= 31; day++) {
          data[employee.id][day] = null;
        }
      }
    });
    
    setScheduleData(data);
    
    // Carregar substituições
    const substitutionData: Record<string, Record<number, ScheduleSubstitution>> = {};
    monthSubstitutions.forEach(sub => {
      if (!substitutionData[sub.employeeId]) {
        substitutionData[sub.employeeId] = {};
      }
      substitutionData[sub.employeeId][sub.day] = sub;
    });
    setLocalSubstitutions(substitutionData);
  }, [allEmployees, monthSchedules, monthSubstitutions, month, year]);

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAllEmployees = () => {
    setSelectedEmployees(employees.map(emp => emp.id));
  };

  const handleDeselectAllEmployees = () => {
    setSelectedEmployees([]);
  };
  // Função para ordenar funcionários por cargo
  const sortEmployeesByPosition = () => {
    const priorityOrder = [
      'Enfermeira',
      'Técnico de Enfermagem',
      'Cuidador de Idosos',
      'Médico',
      'Nutricionista',
      'Fisioterapeuta',
      'Psicóloga',
      'Assistente social',
      'Cozinheira',
      'Auxiliar de Serviços Gerais',
      'Professora de Yoga'
    ];
    
    return allEmployees.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.position);
      const bIndex = priorityOrder.indexOf(b.position);
      
      // Se ambos estão na lista de prioridade, ordenar por índice
      if (aIndex !== -1 && bIndex !== -1) {
        if (aIndex !== bIndex) return aIndex - bIndex;
        // Se mesmo cargo, ordenar por nome
        return a.name.localeCompare(b.name);
      }
      
      // Se apenas um está na lista, priorizar o que está
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // Se nenhum está na lista, ordenar por nome
      return a.name.localeCompare(b.name);
    });
  };

  const sortedEmployees = sortEmployeesByPosition();

  const handleShiftChange = (employeeId: string, day: number, shift: ShiftType | null) => {
    // Atualizar estado local primeiro
    setScheduleData(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [day]: shift,
      }
    }));
  };

  const handleClearSchedule = async () => {
    if (window.confirm(`Tem certeza que deseja limpar toda a escala de ${scheduleType} da unidade ${unit} para ${monthNames[month - 1]} ${year}?`)) {
      try {
        await clearScheduleForMonth(scheduleType, unit, month, year);
        // Limpar dados locais também
        const clearedData: Record<string, Record<number, ShiftType | null>> = {};
        allEmployees.forEach(employee => {
          clearedData[employee.id] = {};
          for (let day = 1; day <= 31; day++) {
            clearedData[employee.id][day] = null;
          }
        });
        setScheduleData(clearedData);
        setLocalSubstitutions({});
      } catch (error) {
        console.error('Erro ao limpar escala:', error);
        alert('Erro ao limpar escala. Tente novamente.');
      }
    }
  };

  const handleAddSubstitute = (employeeId: string, day: number) => {
    setSelectedDay({ employeeId, day });
    setSubstituteForm({
      substituteId: '',
      substituteName: '',
      reason: 'Substituição',
    });
    setShowSubstituteModal(true);
  };

  const handleSubstituteChange = (substituteId: string) => {
    const sobreavisoEmployee = sobreavisoList.find(emp => emp.id === substituteId);
    if (sobreavisoEmployee) {
      setSubstituteForm(prev => ({
        ...prev,
        substituteId,
        substituteName: sobreavisoEmployee.fullName,
      }));
    } else if (substituteId === 'custom') {
      setSubstituteForm(prev => ({
        ...prev,
        substituteId: 'custom',
        substituteName: '',
      }));
    }
  };

  const handleSaveSubstitute = async () => {
    if (!selectedDay || !substituteForm.substituteName.trim()) return;

    // Se for posição vazia, apenas adicionar ao estado local
    const isEmptyPosition = selectedDay.employeeId.startsWith('empty-');
    
    const substitutionData: Omit<ScheduleSubstitution, 'id' | 'createdAt'> = {
      employeeId: selectedDay.employeeId,
      scheduleType,
      unit,
      month,
      year,
      day: selectedDay.day,
      substituteId: substituteForm.substituteId === 'custom' ? undefined : substituteForm.substituteId,
      substituteName: substituteForm.substituteName,
      reason: substituteForm.reason,
    };

    try {
      if (!isEmptyPosition) {
        // Apenas salvar no banco se for funcionário real
        await addSubstitution(substitutionData);
      } else {
        // Para posições vazias, apenas atualizar estado local
        setLocalSubstitutions(prev => ({
          ...prev,
          [selectedDay.employeeId]: {
            ...prev[selectedDay.employeeId],
            [selectedDay.day]: {
              ...substitutionData,
              id: `local-${Date.now()}`,
              createdAt: new Date().toISOString(),
            }
          }
        }));
      }

      setShowSubstituteModal(false);
      setSelectedDay(null);
      setSubstituteForm({
        substituteId: '',
        substituteName: '',
        reason: 'Substituição',
      });
    } catch (error) {
      console.error('Error saving substitution:', error);
      alert('Erro ao salvar substituição. Tente novamente.');
    }
  };

  const handleRemoveSubstitute = async (employeeId: string, day: number) => {
    try {
      const isEmptyPosition = employeeId.startsWith('empty-');
      
      if (!isEmptyPosition) {
        await removeSubstitution(employeeId, scheduleType, unit, month, year, day);
      } else {
        // Para posições vazias, apenas remover do estado local
        setLocalSubstitutions(prev => {
          const updated = { ...prev };
          if (updated[employeeId] && updated[employeeId][day]) {
            delete updated[employeeId][day];
            if (Object.keys(updated[employeeId]).length === 0) {
              delete updated[employeeId];
            }
          }
          return updated;
        });
      }
    } catch (error) {
      console.error('Error removing substitution:', error);
      alert('Erro ao remover substituição. Tente novamente.');
    }
  };

  const handleAddEmptyPositions = () => {
    const { position, quantity } = newPositionForm;
    const newPositions: EmptyPosition[] = [];
    
    for (let i = 1; i <= quantity; i++) {
      newPositions.push({
        id: `empty-${position}-${i}-${Date.now()}-${i}`,
        name: `${position} ${i} - Não Preenchido`,
        position: position,
        cpf: 'Vago',
        unit: unit,
        isEmptyPosition: true,
      });
    }
    
    setEmptyPositions(prev => [...prev, ...newPositions]);
    setShowAddPositionModal(false);
    setNewPositionForm({ position: 'Técnico de Enfermagem', quantity: 1 });
  };

  const handleRemoveEmptyPosition = (positionId: string) => {
    setEmptyPositions(prev => prev.filter(pos => pos.id !== positionId));
    
    // Remover também do scheduleData
    setScheduleData(prev => {
      const updated = { ...prev };
      delete updated[positionId];
      return updated;
    });
    
    // Remover substituições
    setLocalSubstitutions(prev => {
      const updated = { ...prev };
      delete updated[positionId];
      return updated;
    });
  };

  const getShiftColor = (shift: ShiftType | null) => {
    switch (shift) {
      case 'SD': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'DR': return 'bg-green-100 text-green-700 border-green-300';
      case '12': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case '24': return 'bg-red-100 text-red-700 border-red-300';
      case '6h': return 'bg-purple-100 text-acasa-purple border-purple-300';
      default: return 'bg-white border-gray-300';
    }
  };

  const shiftOptions: (ShiftType | null)[] = [null, 'SD', 'DR', '12', '24', '6h'];
  const uniquePositions = new Set(allEmployees.map(emp => emp.position)).size;

  const positionOptions = [
    'Técnico de Enfermagem',
    'Cuidador de Idosos',
    'Enfermeira',
    'Auxiliar de Serviços Gerais',
    'Cozinheira',
    'Nutricionista',
    'Fisioterapeuta',
    'Médico',
    'Outro'
  ];

  return (
    <div className="space-y-4">
      {/* Action Buttons - Moved outside for better UX */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-200 p-4">
        <button
          onClick={() => setShowEmployeeSelection(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          title="Selecionar quais funcionários aparecerão na escala"
        >
          <Users size={16} className="mr-2" />
          Selecionar Funcionários ({selectedEmployees.length})
        </button>
        <button
          onClick={() => setShowAddPositionModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          title="Adicionar posições vazias para preenchimento posterior"
        >
          <Plus size={16} className="mr-2" />
          Adicionar Posição ({emptyPositions.length})
        </button>
        <button
          onClick={handleClearSchedule}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          title="Limpar toda a escala do mês"
        >
          <Trash2 size={16} className="mr-2" />
          Limpar Escala
        </button>
        <button
          onClick={() => setShowMonthlyReport(true)}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          title="Gerar relatório mensal"
        >
          <FileText size={16} className="mr-2" />
          Relatório Mensal
        </button>
      </div>

      {/* Schedule Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-acasa-purple p-4">
          <div className="text-center text-white">
            <h2 className="text-xl font-bold">Escala de {scheduleType}</h2>
            <p className="text-purple-100">
              {unit} • {monthNames[month - 1]} {year} • {filteredEmployees.length} funcionários + {emptyPositions.length} posições vazias
              {uniquePositions > 1 && ` • ${uniquePositions} áreas`}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Table Header */}
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700 border-r border-gray-200 min-w-[200px]">
                  Colaborador
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 border-r border-gray-200 min-w-[100px]">
                  Registro
                </th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                  <th key={day} className="px-2 py-3 text-center font-medium text-gray-700 border-r border-gray-200 min-w-[60px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {sortedEmployees.map((employee, employeeIndex) => {
                const isEmptyPosition = 'isEmptyPosition' in employee && employee.isEmptyPosition;
                
                return (
                  <tr key={employee.id} className={`border-b border-gray-200 ${employeeIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isEmptyPosition ? 'bg-yellow-50' : ''}`}>
                    {/* Employee Info */}
                    <td className="px-4 py-3 border-r border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-medium ${isEmptyPosition ? 'text-gray-500 italic' : 'text-gray-900'}`}>
                            {employee.name}
                          </div>
                          <div className="text-xs text-gray-600">{employee.position}</div>
                        </div>
                        {isEmptyPosition && (
                          <button
                            onClick={() => handleRemoveEmptyPosition(employee.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Remover posição vazia"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 border-r border-gray-200">
                      <div className="text-xs text-gray-600 font-sans">
                        {isEmptyPosition ? 'Vago' : (employee.professionalRegistry || employee.cpf)}
                      </div>
                    </td>
                    
                    {/* Days */}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                      const hasShift = scheduleData[employee.id]?.[day];
                      const hasSubstitution = localSubstitutions[employee.id]?.[day];
                      
                      return (
                        <td key={day} className="px-1 py-2 border-r border-gray-200">
                          <div className="space-y-1">
                            {/* Turno Original */}
                            <select
                              value={scheduleData[employee.id]?.[day] || ''}
                              onChange={async (e) => {
                                const shift = e.target.value === '' ? null : e.target.value as ShiftType;
                                handleShiftChange(employee.id, day, shift);
                                
                                // Lógica de preenchimento automático para 24h e 12h
                                if (shift === '24') {
                                  let nextWorkDay = day + 3;
                                  const updates: Record<number, ShiftType> = {};
                                  
                                  while (nextWorkDay <= daysInMonth) {
                                    updates[nextWorkDay] = '24';
                                    nextWorkDay += 3;
                                  }
                                  
                                  if (Object.keys(updates).length > 0) {
                                    // Atualizar estado local
                                    setScheduleData(prev => ({
                                      ...prev,
                                      [employee.id]: {
                                        ...prev[employee.id],
                                        ...updates,
                                      }
                                    }));
                                    
                                    // Salvar no banco se for funcionário real
                                    const isEmptyPosition = employee.id.startsWith('empty-');
                                    if (!isEmptyPosition) {
                                      // Salvar cada dia individual no banco
                                      Object.entries(updates).forEach(async ([dayStr, shiftType]) => {
                                        try {
                                          await updateScheduleDay(employee.id, scheduleType, unit, month, year, parseInt(dayStr), shiftType);
                                        } catch (error) {
                                          console.error('Error saving auto-filled schedule day:', error);
                                        }
                                      });
                                    }
                                  }
                                } else if (shift === '12') {
                                  let nextWorkDay = day + 2;
                                  const updates: Record<number, ShiftType> = {};
                                  
                                  while (nextWorkDay <= daysInMonth) {
                                    updates[nextWorkDay] = '12';
                                    nextWorkDay += 2;
                                  }
                                  
                                  if (Object.keys(updates).length > 0) {
                                    // Atualizar estado local
                                    setScheduleData(prev => ({
                                      ...prev,
                                      [employee.id]: {
                                        ...prev[employee.id],
                                        ...updates,
                                      }
                                    }));
                                    
                                    // Salvar no banco se for funcionário real
                                    const isEmptyPosition = employee.id.startsWith('empty-');
                                    if (!isEmptyPosition) {
                                      // Salvar cada dia individual no banco
                                      Object.entries(updates).forEach(async ([dayStr, shiftType]) => {
                                        try {
                                          await updateScheduleDay(employee.id, scheduleType, unit, month, year, parseInt(dayStr), shiftType);
                                        } catch (error) {
                                          console.error('Error saving auto-filled schedule day:', error);
                                        }
                                      });
                                    }
                                  }
                                }
                                
                                // Salvar o dia atual no banco se for funcionário real
                                const isEmptyPosition = employee.id.startsWith('empty-');
                                if (!isEmptyPosition) {
                                  // Salvar no banco apenas para funcionários reais (dia atual)
                                  try {
                                    await updateScheduleDay(employee.id, scheduleType, unit, month, year, day, shift);
                                  } catch (error) {
                                    console.error('Error saving schedule:', error);
                                  }
                                }
                              }}
                              className={`w-full px-1 py-1 text-xs border rounded text-center ${getShiftColor(scheduleData[employee.id]?.[day] || null)} ${isEmptyPosition ? 'italic' : ''}`}
                            >
                              <option value="">-</option>
                              <option value="SD">SD</option>
                              <option value="DR">DR</option>
                              <option value="12">12</option>
                              <option value="24">24</option>
                              <option value="6h">6h</option>
                            </select>
                            
                            {/* Substituição */}
                            {hasSubstitution ? (
                              <div className="bg-orange-100 border border-orange-300 rounded px-1 py-0.5 text-xs text-orange-700">
                                <div className="flex items-center justify-between">
                                  <span>⚡ {hasSubstitution.substituteName.split(' ')[0]}</span>
                                  <button
                                    onClick={() => handleRemoveSubstitute(employee.id, day)}
                                    className="text-orange-600 hover:text-orange-800 ml-1"
                                    title="Remover substituição"
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="text-xs text-orange-600">{hasSubstitution.reason}</div>
                              </div>
                            ) : hasShift && (
                              <button
                                onClick={() => handleAddSubstitute(employee.id, day)}
                                className="w-full bg-orange-100 border border-orange-300 rounded px-1 py-0.5 text-xs text-orange-600 hover:bg-orange-200 transition-colors"
                                title="Adicionar substituição/curinga"
                              >
                                + Curinga
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer with Signatures */}
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2 mt-12">
                <p className="text-sm font-medium text-gray-700">Responsável Técnico</p>
                <p className="text-xs text-gray-500">Enfermeira Chefe</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2 mt-12">
                <p className="text-sm font-medium text-gray-700">Nutricionista Responsável</p>
                <p className="text-xs text-gray-500">Área de Nutrição</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>ACASA Residencial Sênior - Escala de {scheduleType}</p>
            <p>Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* Modal de Seleção de Funcionários */}
      {showEmployeeSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Users className="mr-2 text-blue-600" size={24} />
                  Selecionar Funcionários para a Escala
                </h2>
                <p className="text-gray-600 mt-1">
                  {scheduleType} • {unit} • {monthNames[month - 1]} {year}
                </p>
              </div>
              <button
                onClick={() => setShowEmployeeSelection(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
              <div className="space-y-6">
                {/* Controls */}
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-900">
                      {selectedEmployees.length} de {employees.length} funcionários selecionados
                    </p>
                    <p className="text-sm text-blue-700">
                      Apenas os funcionários marcados aparecerão na grade da escala
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSelectAllEmployees}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Marcar Todos
                    </button>
                    <button
                      onClick={handleDeselectAllEmployees}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Desmarcar Todos
                    </button>
                  </div>
                </div>

                {/* Employee List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employees.map(employee => (
                    <div key={employee.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={() => handleEmployeeToggle(employee.id)}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-600">{employee.position}</div>
                          <div className="text-xs text-gray-500 font-mono">{employee.cpf}</div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowEmployeeSelection(false)}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => setShowEmployeeSelection(false)}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Users size={16} className="mr-2" />
                Aplicar Seleção ({selectedEmployees.length} funcionários)
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal para Adicionar Posições */}
      {showAddPositionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Users className="mr-2 text-green-600" size={20} />
                Adicionar Posições Vazias
              </h2>
              <button
                onClick={() => setShowAddPositionModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Adicione posições vazias na escala que serão preenchidas com curingas durante o mês.
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Cargo *
                  </label>
                  <select
                    value={newPositionForm.position}
                    onChange={(e) => setNewPositionForm(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    {positionOptions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade de Posições *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newPositionForm.quantity}
                    onChange={(e) => setNewPositionForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ex: Se precisar de 3 técnicos, digite 3
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>Resultado:</strong> Serão criadas {newPositionForm.quantity} posição(ões): 
                    "{newPositionForm.position} 1", "{newPositionForm.position} 2", etc.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddPositionModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddEmptyPositions}
                disabled={newPositionForm.quantity < 1}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} className="mr-2" />
                Criar {newPositionForm.quantity} Posição(ões)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Substituição */}
      {showSubstituteModal && selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Adicionar Substituição</h2>
              <button
                onClick={() => setShowSubstituteModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Posição:</strong> {allEmployees.find(e => e.id === selectedDay.employeeId)?.name}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Dia:</strong> {selectedDay.day} de {monthNames[month - 1]} {year}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecionar Curinga/Substituto *
                  </label>
                  <select
                    value={substituteForm.substituteId}
                    onChange={(e) => handleSubstituteChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  >
                    <option value="">Selecione um colaborador...</option>
                    {sobreavisoList.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.position})
                      </option>
                    ))}
                    <option value="custom">✏️ Digitar nome manualmente</option>
                  </select>
                  
                  {substituteForm.substituteId === 'custom' && (
                    <input
                      type="text"
                      value={substituteForm.substituteName}
                      onChange={(e) => setSubstituteForm(prev => ({ ...prev, substituteName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent mt-2"
                      placeholder="Digite o nome do substituto..."
                      required
                    />
                  )}
                  
                  {sobreavisoList.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Nenhum colaborador de sobreaviso cadastrado. Cadastre primeiro na seção "Sobreaviso".
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo da Substituição
                  </label>
                  <select
                    value={substituteForm.reason}
                    onChange={(e) => setSubstituteForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                  >
                    <option value="Substituição">Substituição</option>
                    <option value="Falta">Falta</option>
                    <option value="Atestado">Atestado</option>
                    <option value="Férias">Férias</option>
                    <option value="Licença">Licença</option>
                    <option value="Curinga">Curinga</option>
                    <option value="Emergência">Emergência</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowSubstituteModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSubstitute}
                disabled={!substituteForm.substituteName.trim() || (!substituteForm.substituteId && !substituteForm.substituteName.trim())}
                className="flex items-center px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus size={16} className="mr-2" />
                Adicionar Substituição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Report Modal */}
      {showMonthlyReport && (
        <MonthlyReport
          scheduleType={scheduleType}
          unit={unit}
          month={month}
          year={year}
          employees={filteredEmployees}
          onClose={() => setShowMonthlyReport(false)}
        />
      )}

      {/* Legend */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Legenda e Instruções</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-50 border border-yellow-300 rounded mr-2"></div>
              <span>= Posição Vazia</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded mr-2"></div>
              <span>⚡ = Substituição/Curinga</span>
            </div>
            <div className="flex items-center">
              <UserPlus size={16} className="text-orange-600 mr-1" />
              <span>Clique em "+ Curinga" para adicionar substituto</span>
            </div>
            <div className="flex items-center">
              <FileText size={16} className="text-green-600 mr-1" />
              <span>"Relatório Mensal" para validação da enfermeira</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-100 border border-blue-300 rounded text-xs flex items-center justify-center text-blue-700 font-medium">
              SD
            </div>
            <span className="text-sm text-gray-700">Serviço Diurno</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-100 border border-green-300 rounded text-xs flex items-center justify-center text-green-700 font-medium">
              DR
            </div>
            <span className="text-sm text-gray-700">Descanso Remunerado</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-yellow-100 border border-yellow-300 rounded text-xs flex items-center justify-center text-yellow-700 font-medium">
              12
            </div>
            <span className="text-sm text-gray-700">Plantão 12h</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-red-100 border border-red-300 rounded text-xs flex items-center justify-center text-red-700 font-medium">
              24
            </div>
            <span className="text-sm text-gray-700">Plantão 24h</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-purple-100 border border-purple-300 rounded text-xs flex items-center justify-center text-acasa-purple font-medium">
              6h
            </div>
            <span className="text-sm text-gray-700">Plantão 6h</span>
          </div>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Como usar as Posições Vazias:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Selecionar Funcionários:</strong> Clique no botão azul para escolher quais funcionários aparecerão na escala</li>
            <li>• <strong>Adicionar Posição:</strong> Clique no botão verde para criar posições vazias (ex: "Técnico 1", "Cuidador 2")</li>
            <li>• <strong>Definir Escalas:</strong> Marque turnos 24h ou 12h nas posições vazias para criar o padrão do mês</li>
            <li>• <strong>Preencher com Curingas:</strong> Durante o mês, clique em "+ Curinga" para definir quem vai cobrir cada plantão</li>
            <li>• <strong>Escala Automática:</strong> Turnos 24h repetem a cada 3 dias, turnos 12h a cada 2 dias</li>
          </ul>
        </div>
      </div>

      {/* Modal de Substituição */}
      {showSubstituteModal && selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Adicionar Substituição</h2>
              <button
                onClick={() => setShowSubstituteModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Posição:</strong> {allEmployees.find(e => e.id === selectedDay.employeeId)?.name}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Dia:</strong> {selectedDay.day} de {monthNames[month - 1]} {year}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecionar Curinga/Substituto *
                  </label>
                  <select
                    value={substituteForm.substituteId}
                    onChange={(e) => handleSubstituteChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                    required
                  >
                    <option value="">Selecione um colaborador...</option>
                    {sobreavisoList.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.position})
                      </option>
                    ))}
                    <option value="custom">✏️ Digitar nome manualmente</option>
                  </select>
                  
                  {substituteForm.substituteId === 'custom' && (
                    <input
                      type="text"
                      value={substituteForm.substituteName}
                      onChange={(e) => setSubstituteForm(prev => ({ ...prev, substituteName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent mt-2"
                      placeholder="Digite o nome do substituto..."
                      required
                    />
                  )}
                  
                  {sobreavisoList.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Nenhum colaborador de sobreaviso cadastrado. Cadastre primeiro na seção "Sobreaviso".
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo da Substituição
                  </label>
                  <select
                    value={substituteForm.reason}
                    onChange={(e) => setSubstituteForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
                  >
                    <option value="Substituição">Substituição</option>
                    <option value="Falta">Falta</option>
                    <option value="Atestado">Atestado</option>
                    <option value="Férias">Férias</option>
                    <option value="Licença">Licença</option>
                    <option value="Curinga">Curinga</option>
                    <option value="Emergência">Emergência</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowSubstituteModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSubstitute}
                disabled={!substituteForm.substituteName.trim() || (!substituteForm.substituteId && !substituteForm.substituteName.trim())}
                className="flex items-center px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus size={16} className="mr-2" />
                Adicionar Substituição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          .print-container, 
          .print-container * {
            visibility: visible;
          }
          
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          @page {
            size: A4 landscape;
            margin: 0.5in;
          }
          
          table {
            font-size: 10px;
          }
          
          th, td {
            padding: 2px 4px;
          }
        }
      `}</style>
    </div>
  );
};