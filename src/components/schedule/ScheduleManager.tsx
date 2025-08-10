import React, { useState } from 'react';
import { Calendar, Printer, Filter, Users, Download } from 'lucide-react';
import { useSchedule } from '../../contexts/ScheduleContext';
import { ScheduleGrid } from './ScheduleGrid';

export const ScheduleManager: React.FC = () => {
  const { getScheduleEmployees, schedules, loading, tableNotFound } = useSchedule();
  const [selectedType, setSelectedType] = useState<'Geral' | 'Enfermagem' | 'Nutrição'>('Geral');
  const [selectedUnit, setSelectedUnit] = useState<'Botafogo' | 'Tijuca'>('Botafogo');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Verificar se a tabela existe
  const tableExists = !tableNotFound;

  const employees = getScheduleEmployees(selectedType, selectedUnit);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrint = () => {
    window.print();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Geral': return 'bg-purple-100 text-acasa-purple border-purple-200';
      case 'Enfermagem': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Nutrição': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  // Mostrar erro se a tabela não existir
  if (tableNotFound) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-yellow-800 mb-3">
            Tabela de Escalas Não Encontrada
          </h2>
          <p className="text-yellow-700 mb-4">
            A tabela <code className="bg-yellow-100 px-2 py-1 rounded">work_schedules</code> não existe no banco de dados.
          </p>
          <div className="bg-white border border-yellow-200 rounded p-4 text-left">
            <p className="font-semibold text-yellow-800 mb-2">Para resolver:</p>
            <ol className="list-decimal list-inside space-y-1 text-yellow-700 text-sm">
              <li>Acesse seu painel do Supabase</li>
              <li>Vá para "SQL Editor"</li>
              <li>Execute a migração da pasta <code>supabase/migrations/</code></li>
              <li>Recarregue esta página</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-acasa-purple p-4 rounded-full">
            <Calendar className="text-white" size={32} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Escalas de Trabalho</h1>
        <p className="text-gray-600">Gerencie as escalas mensais dos colaboradores</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Tipo de Escala */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Escala</label>
            <div className="flex flex-col space-y-2">
              {(['Geral', 'Enfermagem', 'Nutrição'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                    selectedType === type 
                      ? getTypeColor(type)
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Unidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unidade</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value as 'Botafogo' | 'Tijuca')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
            >
              <option value="Botafogo">Botafogo</option>
              <option value="Tijuca">Tijuca</option>
            </select>
          </div>

          {/* Mês */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mês</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
            >
              {monthNames.map((month, index) => (
                <option key={index + 1} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>

          {/* Ano */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ano</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Ações */}
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-gray-700">Ações</label>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Printer size={16} className="mr-2" />
              Imprimir
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Users size={16} className="mr-1 text-gray-600" />
                <span className="text-sm text-gray-600">
                  {employees.length} colaboradores no {selectedType} - {selectedUnit}
                </span>
              </div>
              <div className="flex items-center">
                <Calendar size={16} className="mr-1 text-gray-600" />
                <span className="text-sm text-gray-600">
                  {monthNames[selectedMonth - 1]} {selectedYear}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              SD=Diurno • DR=Descanso • 12=12h • 24=24h • 6h=6h
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      <ScheduleGrid
        scheduleType={selectedType}
        unit={selectedUnit}
        month={selectedMonth}
        year={selectedYear}
        employees={employees}
        monthNames={monthNames}
      />

      {employees.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum colaborador encontrado</h3>
          <p className="text-gray-600">
            Não há colaboradores ativos na categoria "{selectedType}" para a unidade {selectedUnit}.
          </p>
        </div>
      )}
    </div>
  );
};