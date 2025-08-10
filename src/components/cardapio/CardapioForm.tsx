import React, { useState } from 'react';
import { Save, X, Copy, Lightbulb, ChefHat } from 'lucide-react';
import { WeeklyMenu, DailyMenu } from '../../types';
import { useCardapio } from '../../contexts/CardapioContext';

interface CardapioFormProps {
  menu?: WeeklyMenu;
  unit: 'Botafogo' | 'Tijuca';
  weekStartDate: string;
  weekEndDate: string;
  dietType: 'Dieta Branda' | 'Dieta Pastosa' | 'Dieta Branda para Diabéticos' | 'Dieta Branda para Hipertensos';
  onClose: () => void;
  onSave: () => void;
}

export const CardapioForm: React.FC<CardapioFormProps> = ({ 
  menu, unit, weekStartDate, weekEndDate, dietType, onClose, onSave 
}) => {
  const { addWeeklyMenu, updateWeeklyMenu, getFoodSuggestions, getWeekDates } = useCardapio();
  const [isLoading, setIsLoading] = useState(false);

  const formatWeekRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const end = new Date(endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${start} - ${end}`;
  };

  const weekDates = getWeekDates(weekStartDate);
  
  const defaultDailyMenu: DailyMenu = {
    breakfastCoffee: '',
    morningSnack: '',
    lunch: '',
    dailyJuice: '',
    dessert: '',
    afternoonSnack: '',
    dinner: '',
    eveningJuice: '',
    lateNightSnack: '',
  };

  const [formData, setFormData] = useState<Omit<WeeklyMenu, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>({
    unit,
    dietType,
    weekStartDate,
    weekEndDate,
    weekNumber: weekDates.weekNumber,
    year: weekDates.weekNumber,
    wednesday: menu?.wednesday || { ...defaultDailyMenu },
    thursday: menu?.thursday || { ...defaultDailyMenu },
    friday: menu?.friday || { ...defaultDailyMenu },
    saturday: menu?.saturday || { ...defaultDailyMenu },
    sunday: menu?.sunday || { ...defaultDailyMenu },
    monday: menu?.monday || { ...defaultDailyMenu },
    tuesday: menu?.tuesday || { ...defaultDailyMenu },
    observations: menu?.observations || '',
    dietNotes: menu?.dietNotes || getDietNotes(dietType),
    status: menu?.status || 'Rascunho',
  });

  function getDietNotes(diet: string): string {
    switch (diet) {
      case 'Dieta Branda':
        return 'Todos os caldos e sopas devem ser associados à proteína. Alimentos bem cozidos e temperados.';
      case 'Dieta Pastosa':
        return 'Dieta pastosa deve ser batida/amassada. Sem pedaços sólidos. Consistência homogênea.';
      case 'Dieta Branda para Diabéticos':
        return 'Sem açúcar refinado. Usar adoçante. Controlar carboidratos. Preferir alimentos integrais.';
      case 'Dieta Branda para Hipertensos':
        return 'Pouco sal. Sem frituras. Evitar embutidos. Temperos naturais. Mais frutas e verduras.';
      default:
        return '';
    }
  }

  const dayNames = {
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira', 
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo',
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
  };

  const mealNames = {
    breakfastCoffee: 'Café da manhã',
    morningSnack: 'Colação',
    lunch: 'Almoço',
    dailyJuice: 'Suco do dia',
    dessert: 'Sobremesa',
    afternoonSnack: 'Lanche',
    dinner: 'Jantar',
    eveningJuice: 'Suco do jantar',
    lateNightSnack: 'Ceia',
  };

  const handleDayChange = (day: keyof typeof dayNames, meal: keyof DailyMenu, value: string) => {
    setFormData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [meal]: value,
      }
    }));
  };

  const duplicateDay = (sourceDay: keyof typeof dayNames, targetDay: keyof typeof dayNames) => {
    setFormData(prev => ({
      ...prev,
      [targetDay]: { ...prev[sourceDay] },
    }));
  };

  const duplicateAllDays = (sourceDay: keyof typeof dayNames) => {
    const sourceDayData = formData[sourceDay];
    setFormData(prev => ({
      ...prev,
      wednesday: { ...sourceDayData },
      thursday: { ...sourceDayData },
      friday: { ...sourceDayData },
      saturday: { ...sourceDayData },
      sunday: { ...sourceDayData },
      monday: { ...sourceDayData },
      tuesday: { ...sourceDayData },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (menu) {
        updateWeeklyMenu(menu.id, formData);
      } else {
        addWeeklyMenu(formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar cardápio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-green-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-sans">
              {menu ? 'Editar Cardápio' : 'Novo Cardápio Semanal'}
            </h2>
            <p className="text-gray-600 font-sans">
              {unit} • {dietType} • {formatWeekRange(weekStartDate, weekEndDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-180px)]">
          <div className="p-6 space-y-8">
            {/* Diet Notes */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-2 flex items-center font-sans">
                <Lightbulb className="mr-2" size={16} />
                Orientações da Dieta: {dietType}
              </h3>
              <textarea
                value={formData.dietNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, dietNotes: e.target.value }))}
                className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-sans"
                rows={2}
                placeholder="Orientações específicas para esta dieta..."
              />
            </div>

            {/* Weekly Menu Grid */}
            <div className="space-y-6">
              {(Object.keys(dayNames) as Array<keyof typeof dayNames>).map((day, dayIndex) => (
                <div key={day} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 font-sans">
                        {dayNames[day]} - {new Date(new Date(weekStartDate).getTime() + (dayIndex * 24 * 60 * 60 * 1000)).toLocaleDateString('pt-BR')}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => duplicateAllDays(day)}
                          className="flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-sans"
                          title="Duplicar este dia para toda a semana"
                        >
                          <Copy size={14} className="mr-1" />
                          Duplicar p/ Semana
                        </button>
                        {dayIndex > 0 && (
                          <button
                            type="button"
                            onClick={() => duplicateDay(Object.keys(dayNames)[dayIndex - 1] as keyof typeof dayNames, day)}
                            className="flex items-center px-3 py-1 text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-sans"
                            title="Duplicar do dia anterior"
                          >
                            <Copy size={14} className="mr-1" />
                            Copiar Anterior
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(Object.keys(mealNames) as Array<keyof DailyMenu>).map(meal => (
                        <div key={meal}>
                          <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">
                            {mealNames[meal]}
                          </label>
                          <textarea
                            value={formData[day][meal]}
                            onChange={(e) => handleDayChange(day, meal, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-sans"
                            rows={2}
                            placeholder={`Ex: ${meal === 'lunch' ? 'Arroz, feijão, frango grelhado, legumes' : meal === 'breakfastCoffee' ? 'Pão, café com leite, fruta' : 'Digite o cardápio...'}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Observations */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 font-sans">Observações da Semana</h3>
              <textarea
                value={formData.observations}
                onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-sans"
                rows={3}
                placeholder="Observações especiais para esta semana, alterações, substituições..."
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">Status do Cardápio</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-sans"
              >
                <option value="Rascunho">Rascunho</option>
                <option value="Publicado">Publicado</option>
                <option value="Arquivado">Arquivado</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-sans"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-sans"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save size={16} className="mr-2" />
              )}
              {menu ? 'Atualizar' : 'Salvar'} Cardápio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};