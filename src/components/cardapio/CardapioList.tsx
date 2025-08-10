import React, { useState } from 'react';
import { Edit, Trash2, Eye, Copy, Calendar, FileText, Printer, ChefHat } from 'lucide-react';
import { useCardapio } from '../../contexts/CardapioContext';
import { WeeklyMenu } from '../../types';

interface CardapioListProps {
  unit: string;
  weekStartDate: string;
  dietType: string;
  onEdit: (menu: WeeklyMenu) => void;
}

export const CardapioList: React.FC<CardapioListProps> = ({ unit, weekStartDate, dietType, onEdit }) => {
  const { getMenusByWeek, deleteWeeklyMenu, duplicateMenu } = useCardapio();
  const [selectedMenu, setSelectedMenu] = useState<WeeklyMenu | null>(null);

  const weekMenus = getMenusByWeek(weekStartDate, unit).filter(menu => menu.dietType === dietType);

  const handleDelete = (menu: WeeklyMenu) => {
    if (window.confirm(`Tem certeza que deseja excluir o cardápio de ${menu.dietType}?`)) {
      deleteWeeklyMenu(menu.id);
    }
  };

  const handleDuplicate = (menu: WeeklyMenu) => {
    const nextWeek = new Date(menu.weekStartDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    duplicateMenu(menu.id, nextWeek.toISOString().split('T')[0]);
  };

  const formatWeekRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Publicado': return 'bg-green-100 text-green-700';
      case 'Rascunho': return 'bg-yellow-100 text-yellow-700';
      case 'Arquivado': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handlePrint = (menu: WeeklyMenu) => {
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

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cardápio Semanal - ${menu.dietType}</title>
          <style>
            body { font-family: 'Arial', sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #22c55e; padding-bottom: 20px; }
            .institution { font-size: 24px; font-weight: bold; color: #22c55e; margin-bottom: 10px; }
            .subtitle { font-size: 16px; color: #666; margin-bottom: 5px; }
            .diet-info { background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #22c55e; }
            .day-section { margin-bottom: 30px; page-break-inside: avoid; }
            .day-header { background-color: #22c55e; color: white; padding: 10px 15px; font-weight: bold; font-size: 18px; margin-bottom: 15px; }
            .meals-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
            .meal-item { background-color: #f9fafb; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb; }
            .meal-title { font-weight: bold; color: #374151; margin-bottom: 5px; font-size: 14px; }
            .meal-content { color: #6b7280; font-size: 13px; line-height: 1.4; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
            @page { size: A4; margin: 1in; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="institution">ACASA Residencial Sênior</div>
            <div class="subtitle">Cardápio Semanal - ${menu.dietType}</div>
            <div class="subtitle">Unidade: ${menu.unit} • ${formatWeekRange(menu.weekStartDate, menu.weekEndDate)}</div>
          </div>

          <div class="diet-info">
            <strong>Orientações da Dieta:</strong> ${menu.dietNotes}
            ${menu.observations ? `<br><strong>Observações da Semana:</strong> ${menu.observations}` : ''}
          </div>

          ${Object.entries(dayNames).map(([dayKey, dayName]) => {
            const dayData = menu[dayKey as keyof typeof dayNames] as DailyMenu;
            const dayDate = new Date(menu.weekStartDate);
            dayDate.setDate(dayDate.getDate() + Object.keys(dayNames).indexOf(dayKey));
            
            return `
              <div class="day-section">
                <div class="day-header">${dayName} - ${dayDate.toLocaleDateString('pt-BR')}</div>
                <div class="meals-grid">
                  ${Object.entries(mealNames).map(([mealKey, mealName]) => `
                    <div class="meal-item">
                      <div class="meal-title">${mealName}</div>
                      <div class="meal-content">${dayData[mealKey as keyof DailyMenu] || 'Não definido'}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}

          <div class="footer">
            <p><strong>ACASA Residencial Sênior</strong> - Cardápio ${menu.dietType}</p>
            <p>Nutricionista Responsável: _________________________ Data: ___/___/_____</p>
            <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Menu Cards */}
      {weekMenus.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {weekMenus.map(menu => (
            <div key={menu.id} className="bg-white rounded-lg border border-gray-200 hover:border-green-500 transition-all duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 font-sans">{menu.dietType}</h3>
                    <div className="text-sm text-gray-600 space-y-1 font-sans">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-2 text-green-600" />
                        <span>{formatWeekRange(menu.weekStartDate, menu.weekEndDate)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Semana:</span> {menu.weekNumber}/{menu.year}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full font-sans ${getStatusColor(menu.status)}`}>
                    {menu.status}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm font-sans">Preview do Cardápio:</h4>
                  <div className="text-xs text-gray-600 space-y-1 font-sans">
                    <div><strong>Quarta - Almoço:</strong> {menu.wednesday.lunch || 'Não definido'}</div>
                    <div><strong>Quinta - Jantar:</strong> {menu.thursday.dinner || 'Não definido'}</div>
                    <div><strong>Sexta - Café:</strong> {menu.friday.breakfastCoffee || 'Não definido'}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedMenu(menu)}
                    className="text-center py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm font-medium border border-green-600 font-sans px-3"
                  >
                    Ver Completo
                  </button>
                  <button
                    onClick={() => handlePrint(menu)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-600"
                    title="Imprimir cardápio"
                  >
                    <Printer size={16} />
                  </button>
                  <button
                    onClick={() => onEdit(menu)}
                    className="text-center py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium border border-blue-600 font-sans px-3"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDuplicate(menu)}
                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors border border-orange-600"
                    title="Duplicar para próxima semana"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(menu)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ChefHat className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2 font-sans">Nenhum cardápio encontrado</h3>
          <p className="text-gray-600 font-sans">
            Não há cardápio para {dietType} na semana selecionada.
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-green-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-sans">{selectedMenu.dietType}</h2>
                <p className="text-gray-600 font-sans">
                  {selectedMenu.unit} • {formatWeekRange(selectedMenu.weekStartDate, selectedMenu.weekEndDate)}
                </p>
              </div>
              <button
                onClick={() => setSelectedMenu(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-160px)] p-6">
              <div className="space-y-6">
                {Object.entries({
                  wednesday: 'Quarta-feira',
                  thursday: 'Quinta-feira',
                  friday: 'Sexta-feira',
                  saturday: 'Sábado', 
                  sunday: 'Domingo',
                  monday: 'Segunda-feira',
                  tuesday: 'Terça-feira',
                }).map(([dayKey, dayName], dayIndex) => {
                  const dayData = selectedMenu[dayKey as keyof WeeklyMenu] as DailyMenu;
                  const dayDate = new Date(selectedMenu.weekStartDate);
                  dayDate.setDate(dayDate.getDate() + dayIndex);
                  
                  return (
                    <div key={dayKey} className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 font-sans">
                        {dayName} - {dayDate.toLocaleDateString('pt-BR')}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries({
                          breakfastCoffee: 'Café da manhã',
                          morningSnack: 'Colação',
                          lunch: 'Almoço',
                          dailyJuice: 'Suco do dia',
                          dessert: 'Sobremesa',
                          afternoonSnack: 'Lanche',
                          dinner: 'Jantar',
                          eveningJuice: 'Suco do jantar',
                          lateNightSnack: 'Ceia',
                        }).map(([mealKey, mealName]) => (
                          <div key={mealKey} className="bg-white p-3 rounded border">
                            <h4 className="font-medium text-sm text-gray-900 mb-1 font-sans">{mealName}</h4>
                            <p className="text-sm text-gray-700 font-sans">
                              {dayData[mealKey as keyof DailyMenu] || 'Não definido'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedMenu(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-sans"
              >
                Fechar
              </button>
              <button
                onClick={() => handlePrint(selectedMenu)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-sans"
              >
                <Printer size={16} className="mr-2" />
                Imprimir
              </button>
              <button
                onClick={() => {
                  onEdit(selectedMenu);
                  setSelectedMenu(null);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-sans"
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