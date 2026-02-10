import React from 'react';
import { Check } from 'lucide-react';

interface MonthSelectorProps {
  selectedMonths: string[];
  onChange: (months: string[]) => void;
  year?: number;
  label: string;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonths,
  onChange,
  year = 2026,
  label
}) => {
  const months = [
    { name: 'Jan', value: '01' },
    { name: 'Fev', value: '02' },
    { name: 'Mar', value: '03' },
    { name: 'Abr', value: '04' },
    { name: 'Mai', value: '05' },
    { name: 'Jun', value: '06' },
    { name: 'Jul', value: '07' },
    { name: 'Ago', value: '08' },
    { name: 'Set', value: '09' },
    { name: 'Out', value: '10' },
    { name: 'Nov', value: '11' },
    { name: 'Dez', value: '12' },
  ];

  const toggleMonth = (monthValue: string) => {
    const monthKey = `${year}-${monthValue}`;
    const isSelected = selectedMonths.includes(monthKey);

    if (isSelected) {
      onChange(selectedMonths.filter(m => m !== monthKey));
    } else {
      onChange([...selectedMonths, monthKey].sort());
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="grid grid-cols-6 gap-2">
        {months.map((month) => {
          const monthKey = `${year}-${month.value}`;
          const isSelected = selectedMonths.includes(monthKey);

          return (
            <button
              key={month.value}
              type="button"
              onClick={() => toggleMonth(month.value)}
              className={`relative px-3 py-2 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {isSelected && (
                <Check
                  size={14}
                  className="absolute top-0.5 right-0.5 text-blue-500"
                />
              )}
              <span className="text-sm">{month.name}</span>
            </button>
          );
        })}
      </div>
      {selectedMonths.length > 0 && (
        <p className="text-sm text-gray-600">
          {selectedMonths.length} {selectedMonths.length === 1 ? 'mês selecionado' : 'meses selecionados'}
        </p>
      )}
    </div>
  );
};
