import React, { useState } from 'react';
import { ChefHat, Plus, Calendar, Filter, FileText, Copy } from 'lucide-react';
import { useCardapio } from '../../contexts/CardapioContext';
import { CardapioForm } from './CardapioForm';
import { CardapioList } from './CardapioList';

export const CardapioManager: React.FC = () => {
  const { getWeekDates } = useCardapio();
  const [showForm, setShowForm] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<'Botafogo'>('Botafogo');
  const [selectedWeek, setSelectedWeek] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedDiet, setSelectedDiet] = useState<string>('Dieta Branda');

  const weekDates = getWeekDates(selectedWeek);

  const dietTypes = [
    'Dieta Branda',
    'Dieta Pastosa', 
    'Dieta Branda para Diabéticos',
    'Dieta Branda para Hipertensos'
  ];

  const getDietColor = (diet: string) => {
    switch (diet) {
      case 'Dieta Branda': return 'bg-green-100 text-green-700 border-green-200';
      case 'Dieta Pastosa': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Dieta Branda para Diabéticos': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Dieta Branda para Hipertensos': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatWeekRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-full">
            <ChefHat className="text-white" size={32} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 font-sans">
          Gestão de Cardápios
        </h1>
        <p className="text-gray-600 font-sans">Planeje e gerencie os cardápios semanais das unidades</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Unidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">Unidade</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value as 'Botafogo')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-sans"
            >
              <option value="Botafogo">Botafogo</option>
            </select>
          </div>

          {/* Semana */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">Primeiro Dia da Semana</label>
            <input
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-sans"
            />
            <p className="text-xs text-gray-500 mt-1 font-sans">
              Semana: {formatWeekRange(weekDates.start, weekDates.end)}
            </p>
          </div>

          {/* Tipo de Dieta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">Tipo de Dieta</label>
            <select
              value={selectedDiet}
              onChange={(e) => setSelectedDiet(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-sans"
            >
              {dietTypes.map(diet => (
                <option key={diet} value={diet}>{diet}</option>
              ))}
            </select>
          </div>

          {/* Ação */}
          <div className="flex flex-col justify-end">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center justify-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium font-sans"
            >
              <Plus size={20} className="mr-2" />
              Novo Cardápio
            </button>
          </div>
        </div>

        {/* Diet Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dietTypes.map(diet => (
            <div 
              key={diet}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedDiet === diet 
                  ? getDietColor(diet)
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedDiet(diet)}
            >
              <h3 className="font-semibold text-sm mb-2 font-sans">{diet}</h3>
              <div className="text-xs text-gray-600 font-sans">
                {diet === 'Dieta Branda' && 'Alimentação normal, bem cozida e temperada'}
                {diet === 'Dieta Pastosa' && 'Alimentos batidos/amassados, sem pedaços'}  
                {diet === 'Dieta Branda para Diabéticos' && 'Sem açúcar, baixo carboidrato'}
                A partir da data selecionada
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Week Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="text-green-600 mr-3" size={20} />
            <div>
              <h3 className="font-semibold text-green-800 font-sans">
                Semana Selecionada: {selectedWeek ? new Date(selectedWeek).toLocaleDateString('pt-BR') : ''} até {weekDates.end ? new Date(weekDates.end).toLocaleDateString('pt-BR') : ''}
              </h3>
              <p className="text-sm text-green-600 font-sans">
                {selectedUnit} • {selectedDiet} • 7 dias consecutivos
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-green-600 font-sans">
              Semana {weekDates.weekNumber} de {new Date(weekDates.start).getFullYear()}
            </div>
            <div className="text-xs text-green-500 font-sans">
              7 dias consecutivos
            </div>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <CardapioList 
        unit={selectedUnit}
        weekStartDate={weekDates.start}
        dietType={selectedDiet}
        onEdit={(menu) => {
          // TODO: implementar edição
          setShowForm(true);
        }}
      />

      {/* Form Modal */}
      {showForm && (
        <CardapioForm
          unit={selectedUnit}
          weekStartDate={weekDates.start}
          weekEndDate={weekDates.end}
          dietType={selectedDiet as any}
          onClose={() => setShowForm(false)}
          onSave={() => {
            setShowForm(false);
            // Refresh list
          }}
        />
      )}
    </div>
  );
};