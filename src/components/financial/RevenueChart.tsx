import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { MonthlyRevenue } from '../../types/financial';

interface RevenueChartProps {
  data: MonthlyRevenue[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentMonthIndex = data.findIndex(d => d.month === currentMonth);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  };

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {data.map((item, index) => {
          const isPast = index < currentMonthIndex;
          const isCurrent = index === currentMonthIndex;
          const isFuture = index > currentMonthIndex;
          const heightPercentage = (item.revenue / maxRevenue) * 100;
          const previousRevenue = index > 0 ? data[index - 1].revenue : item.revenue;
          const change = calculateChange(item.revenue, previousRevenue);

          return (
            <div key={item.month} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className={`font-medium ${isCurrent ? 'text-acasa-purple' : 'text-gray-700'}`}>
                    {formatMonth(item.month)}
                    {isCurrent && ' (Atual)'}
                    {isFuture && ' (Previsão)'}
                  </span>
                  {index > 0 && (
                    <span className={`text-xs flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {Math.abs(change).toFixed(1)}%
                    </span>
                  )}
                </div>
                <span className={`font-semibold ${isCurrent ? 'text-acasa-purple' : 'text-gray-900'}`}>
                  R$ {item.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isPast
                      ? 'bg-green-500'
                      : isCurrent
                      ? 'bg-acasa-purple'
                      : 'bg-blue-300'
                  }`}
                  style={{ width: `${heightPercentage}%` }}
                />
              </div>

              {item.revenueLoss > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-red-600">
                    Perda: R$ {item.revenueLoss.toFixed(2)} ({item.inactiveGuests} hóspede{item.inactiveGuests !== 1 ? 's' : ''})
                  </span>
                  <span className="text-gray-600">
                    Líquido: R$ {item.netRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="text-xs text-gray-500">
                {item.activeGuests} hóspede{item.activeGuests !== 1 ? 's ativo' : ' ativo'}{item.activeGuests !== 1 ? 's' : ''}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
        <div className="text-center">
          <div className="w-4 h-4 bg-green-500 rounded mx-auto mb-2" />
          <p className="text-xs text-gray-600">Realizado</p>
        </div>
        <div className="text-center">
          <div className="w-4 h-4 bg-acasa-purple rounded mx-auto mb-2" />
          <p className="text-xs text-gray-600">Mês Atual</p>
        </div>
        <div className="text-center">
          <div className="w-4 h-4 bg-blue-300 rounded mx-auto mb-2" />
          <p className="text-xs text-gray-600">Previsão</p>
        </div>
      </div>
    </div>
  );
};
