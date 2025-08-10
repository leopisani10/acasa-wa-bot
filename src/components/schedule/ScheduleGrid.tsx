import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Trash2, UserPlus, Edit3, FileText } from 'lucide-react';
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
  const [showSubstituteModal, setShowSubstituteModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{ employeeId: string; day: number } | null>(null);
  const [substituteForm, setSubstituteForm] = useState({
    substituteId: '',
    substituteName: '',
    reason: 'Substituição',
  });
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);

  const monthSchedules = getScheduleForMonth(scheduleType, unit, month, year);
  const monthSubstitutions = getSubstitutionsForMonth(scheduleType, unit, month, year);
  const daysInMonth = new Date(year, month, 0).getDate();
  const sobreavisoList = getSobreavisoByUnit(unit);

  useEffect(() => {
    // Carregar dados da escala
    const data: Record<string, Record<number, ShiftType | null>> = {};
    
    employees.forEach(employee => {
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
  }, [employees, monthSchedules, monthSubstitutions, month, year]);

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
    
    return employees.sort((a, b) => {
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
    // Primeiro, definir o turno principal
    setScheduleData(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [day]: shift,
      }
    }));

    // Depois, aplicar lógica automática se necessário
    if (shift === '24') {
      // Escala 24h48h: trabalha 1 dia, descansa 2 dias (ciclo de 3 dias)
      // Aplicar padrão para todo o mês
      let nextWorkDay = day + 3;
      const updates: Record<number, ShiftType> = {};
      
      while (nextWorkDay <= daysInMonth) {
        updates[nextWorkDay] = '24';
        nextWorkDay += 3;
      }
      
      if (Object.keys(updates).length > 0) {
        setScheduleData(prev => ({
          ...prev,
          [employeeId]: {
            ...prev[employeeId],
            ...updates,
          }
        }));
      }
    } else if (shift === '12') {
      // Escala 12h36h: trabalha 1 dia, descansa 1 dia (ciclo de 2 dias)
      // Aplicar padrão para todo o mês
      let nextWorkDay = day + 2;
      const updates: Record<number, ShiftType> = {};
      
      while (nextWorkDay <= daysInMonth) {
        updates[nextWorkDay] = '12';
        nextWorkDay += 2;
      }
      
      if (Object.keys(updates).length > 0) {
        setScheduleData(prev => ({
          ...prev,
          [employeeId]: {
            ...prev[employeeId],
            ...updates,
          }
        }));
      }
    }
  };

  const handleClearSchedule = async () => {
    if (window.confirm(`Tem certeza que deseja limpar toda a escala de ${scheduleType} da unidade ${unit} para ${monthNames[month - 1]} ${year}?`)) {
      try {
        await clearScheduleForMonth(scheduleType, unit, month, year);
        // Limpar dados locais também
        const clearedData: Record<string, Record<number, ShiftType | null>> = {};
        employees.forEach(employee => {
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
      await addSubstitution(substitutionData);

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
      await removeSubstitution(employeeId, scheduleType, unit, month, year, day);
    } catch (error) {
      console.error('Error removing substitution:', error);
      alert('Erro ao remover substituição. Tente novamente.');
    }
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
  const uniquePositions = new Set(employees.map(emp => emp.position)).size;

  return (
    <div className="space-y-4">
      {/* Schedule Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-acasa-purple p-4">
          <div className="flex items-center justify-between">
            <div className="text-center text-white flex-1">
              <h2 className="text-xl font-bold">Escala de {scheduleType}</h2>
              <p className="text-purple-100">
                {unit} • {monthNames[month - 1]} {year} • {employees.length} colaboradores
                {uniquePositions > 1 && ` • ${uniquePositions} áreas`}
              </p>
            </div>
            <button
              onClick={handleClearSchedule}
              className="ml-4 flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              title="Limpar toda a escala do mês"
            >
              <Trash2 size={16} className="mr-2" />
              Limpar Escala
            </button>
            <button
              onClick={() => setShowMonthlyReport(true)}
              className="ml-2 flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Gerar relatório mensal"
            >
              <FileText size={16} className="mr-2" />
              Relatório Mensal
            </button>
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
              {sortedEmployees.map((employee, employeeIndex) => (
                <tr key={employee.id} className={`border-b border-gray-200 ${employeeIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  {/* Employee Info */}
                  <td className="px-4 py-3 border-r border-gray-200">
                    <div>
                      <div className="font-medium text-gray-900">{employee.name}</div>
                      <div className="text-xs text-gray-600">{employee.position}</div>
                    </div>
                  </td>
                  <td className="px-2 py-3 border-r border-gray-200">
                    <div className="text-xs text-gray-600 font-sans">
                      {employee.professionalRegistry || employee.cpf}
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
                              const shift = e.target.value as ShiftType || null;
                              handleShiftChange(employee.id, day, shift);
                              
                              // Salvar automaticamente no banco
                              try {
                                await updateScheduleDay(employee.id, scheduleType, unit, month, year, day, shift);
                                
                                // Se é escala automática, salvar também todos os próximos dias do padrão
                                if (shift === '24') {
                                  let nextWorkDay = day + 3;
                                  while (nextWorkDay <= daysInMonth) {
                                    await updateScheduleDay(employee.id, scheduleType, unit, month, year, nextWorkDay, '24');
                                    handleShiftChange(employee.id, nextWorkDay, '24');
                                    nextWorkDay += 3;
                                  }
                                } else if (shift === '12') {
                                  let nextWorkDay = day + 2;
                                  while (nextWorkDay <= daysInMonth) {
                                    await updateScheduleDay(employee.id, scheduleType, unit, month, year, nextWorkDay, '12');
                                    handleShiftChange(employee.id, nextWorkDay, '12');
                                    nextWorkDay += 2;
                                  }
                                }
                              } catch (error) {
                                console.error('Error saving schedule:', error);
                              }
                            }}
                            className={`w-full px-1 py-1 text-xs border rounded text-center ${getShiftColor(scheduleData[employee.id]?.[day] || null)}`}
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
              ))}
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
                  <strong>Colaborador original:</strong> {employees.find(e => e.id === selectedDay.employeeId)?.name}
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

      {/* Legend */}
      {/* Monthly Report Modal */}
      {showMonthlyReport && (
        <MonthlyReport
          scheduleType={scheduleType}
          unit={unit}
          month={month}
          year={year}
          employees={employees}
          onClose={() => setShowMonthlyReport(false)}
        />
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Legenda</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
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
      </div>

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