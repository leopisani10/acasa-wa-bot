import React from 'react';
import { TrendingUp, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { FinancialAdjustment } from '../../types/financial';

interface AdjustmentHistoryProps {
  adjustments: FinancialAdjustment[];
  guestName: string;
}

export const AdjustmentHistory: React.FC<AdjustmentHistoryProps> = ({ adjustments, guestName }) => {
  if (adjustments.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p className="text-gray-600">Nenhum reajuste registrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 mb-4">
        Histórico de Reajustes - {guestName}
      </h3>
      {adjustments.map((adjustment) => (
        <div
          key={adjustment.id}
          className="border border-gray-200 rounded-lg p-4 hover:border-acasa-purple transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <Calendar className="text-gray-400 mr-2" size={16} />
              <span className="text-sm text-gray-600">
                {new Date(adjustment.adjustmentDate).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div className={`flex items-center ${adjustment.adjustmentPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {adjustment.adjustmentPercentage >= 0 ? (
                <ArrowUp size={16} className="mr-1" />
              ) : (
                <ArrowDown size={16} className="mr-1" />
              )}
              <span className="font-semibold">
                {adjustment.adjustmentPercentage >= 0 ? '+' : ''}{adjustment.adjustmentPercentage.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Valor Anterior</p>
              <p className="text-lg font-semibold text-gray-900">
                R$ {adjustment.previousMonthlyFee.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Novo Valor</p>
              <p className="text-lg font-semibold text-acasa-purple">
                R$ {adjustment.newMonthlyFee.toFixed(2)}
              </p>
            </div>
          </div>

          {adjustment.notes && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Observações</p>
              <p className="text-sm text-gray-700">{adjustment.notes}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
