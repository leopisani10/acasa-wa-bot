import React from 'react';
import { Calendar } from 'lucide-react';

interface DateSelectorProps {
  month: string;
  year: number;
  selectedDates: string[];
  onChange: (dates: string[]) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  month,
  year,
  selectedDates,
  onChange,
}) => {
  const getDaysInMonth = (m: string, y: number) => {
    return new Date(y, parseInt(m), 0).getDate();
  };

  const getFirstDayOfMonth = (m: string, y: number) => {
    return new Date(y, parseInt(m) - 1, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);

  const toggleDate = (day: number) => {
    const dateStr = `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    if (selectedDates.includes(dateStr)) {
      onChange(selectedDates.filter(d => d !== dateStr));
    } else {
      onChange([...selectedDates, dateStr].sort());
    }
  };

  const isDateSelected = (day: number) => {
    const dateStr = `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return selectedDates.includes(dateStr);
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const formatSelectedDates = () => {
    if (selectedDates.length === 0) return 'Nenhum dia selecionado';
    if (selectedDates.length === 1) return '1 dia selecionado';
    return `${selectedDates.length} dias selecionados`;
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-acasa-purple" />
          <h4 className="font-medium text-gray-900">Selecione os dias trabalhados</h4>
        </div>
        <span className="text-sm text-gray-600 font-medium">{formatSelectedDates()}</span>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-600 py-2"
          >
            {day}
          </div>
        ))}

        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const selected = isDateSelected(day);
          const dayOfWeek = (firstDay + day - 1) % 7;
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          return (
            <button
              key={day}
              type="button"
              onClick={() => toggleDate(day)}
              className={`
                aspect-square flex items-center justify-center rounded-lg text-sm font-medium
                transition-all duration-200 hover:scale-105
                ${selected
                  ? 'bg-acasa-purple text-white shadow-md hover:bg-purple-700'
                  : isWeekend
                  ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selectedDates.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">Datas selecionadas:</p>
          <div className="flex flex-wrap gap-2">
            {selectedDates.slice(0, 10).map((date) => {
              const [y, m, d] = date.split('-');
              return (
                <span
                  key={date}
                  className="px-2 py-1 bg-acasa-purple text-white text-xs rounded-md"
                >
                  {d}/{m}
                </span>
              );
            })}
            {selectedDates.length > 10 && (
              <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-md">
                +{selectedDates.length - 10} mais
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
