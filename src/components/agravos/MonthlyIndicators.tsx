import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calculator, FileText, Download } from 'lucide-react';
import { useAgravos } from '../../contexts/AgravosContext';
import { MonthlyAgravosIndicators } from '../../types/agravos';

interface MonthlyIndicatorsProps {
  month: number;
  year: number;
  unit: 'Botafogo' | 'Tijuca';
}

export const MonthlyIndicators: React.FC<MonthlyIndicatorsProps> = ({ month, year, unit }) => {
  const { getMonthlyIndicators, calculateMonthlyIndicators, getDailyRecordsForMonth } = useAgravos();
  const [populacaoBase, setPopulacaoBase] = useState(0);
  const [showCalculation, setShowCalculation] = useState(false);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const indicators = getMonthlyIndicators(month, year, unit);
  const dailyRecords = getDailyRecordsForMonth(month, year, unit);

  const handleCalculateIndicators = () => {
    if (populacaoBase <= 0) {
      alert('Informe o número de residentes no dia 15 do mês');
      return;
    }

    calculateMonthlyIndicators(month, year, unit, populacaoBase);
    setShowCalculation(false);
  };

  const formatRate = (rate: number) => {
    return rate.toFixed(2);
  };

  const generateReport = () => {
    if (!indicators) return;

    const reportContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Indicadores de Agravos - ${monthNames[month - 1]} ${year}</title>
          <style>
            body { font-family: 'Arial', sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #dc2626; padding-bottom: 20px; }
            .institution { font-size: 24px; font-weight: bold; color: #dc2626; margin-bottom: 10px; }
            .subtitle { font-size: 16px; color: #666; }
            .indicators-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .indicator-card { background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; }
            .indicator-title { font-weight: bold; color: #dc2626; margin-bottom: 10px; }
            .indicator-value { font-size: 24px; font-weight: bold; color: #333; }
            .indicator-unit { font-size: 14px; color: #666; }
            .totals-section { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .totals-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
            .total-item { text-align: center; }
            .total-number { font-size: 20px; font-weight: bold; color: #dc2626; }
            .total-label { font-size: 12px; color: #666; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="institution">ACASA Residencial Sênior</div>
            <div class="subtitle">Indicadores de Agravos - ${monthNames[month - 1]} ${year}</div>
            <div class="subtitle">Unidade: ${unit} • População Base: ${indicators.populacaoBase} residentes</div>
          </div>

          <div class="indicators-grid">
            <div class="indicator-card">
              <div class="indicator-title">Taxa de Mortalidade</div>
              <div class="indicator-value">${formatRate(indicators.taxaMortalidade)}</div>
              <div class="indicator-unit">por 1000 residentes/mês</div>
            </div>
            
            <div class="indicator-card">
              <div class="indicator-title">Taxa de Incidência de Diarreia</div>
              <div class="indicator-value">${formatRate(indicators.taxaIncidenciaDiarreia)}</div>
              <div class="indicator-unit">por 1000 residentes/mês</div>
            </div>
            
            <div class="indicator-card">
              <div class="indicator-title">Taxa de Incidência de Escabiose</div>
              <div class="indicator-value">${formatRate(indicators.taxaIncidenciaEscabiose)}</div>
              <div class="indicator-unit">por 1000 residentes/mês</div>
            </div>
            
            <div class="indicator-card">
              <div class="indicator-title">Taxa de Incidência de Desidratação</div>
              <div class="indicator-value">${formatRate(indicators.taxaIncidenciaDesidratacao)}</div>
              <div class="indicator-unit">por 1000 residentes/mês</div>
            </div>
            
            <div class="indicator-card">
              <div class="indicator-title">Taxa de Prevalência de Lesão por Pressão</div>
              <div class="indicator-value">${formatRate(indicators.taxaPrevalenciaLesaoPressao)}</div>
              <div class="indicator-unit">por 1000 residentes/mês</div>
            </div>
          </div>

          <div class="totals-section">
            <h3 style="margin-bottom: 20px; color: #dc2626; font-weight: bold;">Totais Absolutos do Mês</h3>
            <div class="totals-grid">
              <div class="total-item">
                <div class="total-number">${indicators.totalQuedaComLesao}</div>
                <div class="total-label">Quedas c/ Lesão</div>
              </div>
              <div class="total-item">
                <div class="total-number">${indicators.totalQuedaSemLesao}</div>
                <div class="total-label">Quedas s/ Lesão</div>
              </div>
              <div class="total-item">
                <div class="total-number">${indicators.totalLesaoPorPressao}</div>
                <div class="total-label">Lesões Pressão</div>
              </div>
              <div class="total-item">
                <div class="total-number">${indicators.totalDiarreia}</div>
                <div class="total-label">Diarreia</div>
              </div>
              <div class="total-item">
                <div class="total-number">${indicators.totalEscabiose}</div>
                <div class="total-label">Escabiose</div>
              </div>
              <div class="total-item">
                <div class="total-number">${indicators.totalDesidratacao}</div>
                <div class="total-label">Desidratação</div>
              </div>
              <div class="total-item">
                <div class="total-number">${indicators.totalObito}</div>
                <div class="total-label">Óbitos</div>
              </div>
              <div class="total-item">
                <div class="total-number">${indicators.totalTentativaSuicidio}</div>
                <div class="total-label">Tent. Suicídio</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p><strong>ACASA Residencial Sênior</strong> - Indicadores de Agravos</p>
            <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
            <p>Responsável Técnico: _________________________ Data: ___/___/_____</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="text-red-600 mr-3" size={20} />
            <div>
              <h3 className="font-semibold text-red-800">
                Indicadores Mensais de Agravos
              </h3>
              <p className="text-sm text-red-600">
                {monthNames[month - 1]} {year} • {unit} • {dailyRecords.length} dias registrados
              </p>
            </div>
          </div>
          {indicators && (
            <button
              onClick={generateReport}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Download size={16} className="mr-2" />
              Exportar PDF
            </button>
          )}
        </div>
      </div>

      {!indicators ? (
        /* Calculation Setup */
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-center">
            <Calculator className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Calcular Indicadores do Mês
            </h3>
            <p className="text-gray-600 mb-6">
              Para gerar os indicadores mensais, informe o número de residentes no dia 15.
            </p>
            
            <div className="max-w-sm mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                População Base (Residentes no dia 15) *
              </label>
              <input
                type="number"
                min="1"
                value={populacaoBase}
                onChange={(e) => setPopulacaoBase(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-center"
                placeholder="Ex: 45"
                required
              />
              <button
                onClick={handleCalculateIndicators}
                disabled={populacaoBase <= 0}
                className="w-full mt-4 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calculator size={16} className="mr-2" />
                Calcular Indicadores
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Indicators Display */
        <div className="space-y-6">
          {/* Key Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm">Taxa de Mortalidade</h4>
                <TrendingUp className="text-red-600" size={16} />
              </div>
              <div className="text-2xl font-bold text-red-600">{formatRate(indicators.taxaMortalidade)}</div>
              <div className="text-xs text-gray-600">por 1000 residentes/mês</div>
            </div>

            <div className="bg-white border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm">Incidência de Diarreia</h4>
                <TrendingUp className="text-yellow-600" size={16} />
              </div>
              <div className="text-2xl font-bold text-yellow-600">{formatRate(indicators.taxaIncidenciaDiarreia)}</div>
              <div className="text-xs text-gray-600">por 1000 residentes/mês</div>
            </div>

            <div className="bg-white border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm">Prevalência Lesão Pressão</h4>
                <TrendingUp className="text-purple-600" size={16} />
              </div>
              <div className="text-2xl font-bold text-purple-600">{formatRate(indicators.taxaPrevalenciaLesaoPressao)}</div>
              <div className="text-xs text-gray-600">por 1000 residentes/mês</div>
            </div>

            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm">Incidência Desidratação</h4>
                <TrendingUp className="text-blue-600" size={16} />
              </div>
              <div className="text-2xl font-bold text-blue-600">{formatRate(indicators.taxaIncidenciaDesidratacao)}</div>
              <div className="text-xs text-gray-600">por 1000 residentes/mês</div>
            </div>

            <div className="bg-white border border-pink-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm">Incidência Escabiose</h4>
                <TrendingUp className="text-pink-600" size={16} />
              </div>
              <div className="text-2xl font-bold text-pink-600">{formatRate(indicators.taxaIncidenciaEscabiose)}</div>
              <div className="text-xs text-gray-600">por 1000 residentes/mês</div>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Totais Absolutos do Mês</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="text-center p-3 bg-red-50 rounded border border-red-200">
                <div className="text-xl font-bold text-red-600">{indicators.totalQuedaComLesao}</div>
                <div className="text-xs text-gray-600">Quedas c/ Lesão</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded border border-orange-200">
                <div className="text-xl font-bold text-orange-600">{indicators.totalQuedaSemLesao}</div>
                <div className="text-xs text-gray-600">Quedas s/ Lesão</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded border border-purple-200">
                <div className="text-xl font-bold text-purple-600">{indicators.totalLesaoPorPressao}</div>
                <div className="text-xs text-gray-600">Lesões Pressão</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded border border-yellow-200">
                <div className="text-xl font-bold text-yellow-600">{indicators.totalDiarreia}</div>
                <div className="text-xs text-gray-600">Diarreia</div>
              </div>
              <div className="text-center p-3 bg-pink-50 rounded border border-pink-200">
                <div className="text-xl font-bold text-pink-600">{indicators.totalEscabiose}</div>
                <div class="text-xs text-gray-600">Escabiose</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded border border-blue-200">
                <div className="text-xl font-bold text-blue-600">{indicators.totalDesidratacao}</div>
                <div className="text-xs text-gray-600">Desidratação</div>
              </div>
              <div className="text-center p-3 bg-gray-800 rounded">
                <div className="text-xl font-bold text-white">{indicators.totalObito}</div>
                <div className="text-xs text-gray-300">Óbitos</div>
              </div>
              <div className="text-center p-3 bg-red-800 rounded">
                <div className="text-xl font-bold text-white">{indicators.totalTentativaSuicidio}</div>
                <div className="text-xs text-gray-300">Tent. Suicídio</div>
              </div>
            </div>
          </div>

          {/* Base Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">População Base:</span>
                <span className="ml-2 font-bold text-gray-900">{indicators.populacaoBase} residentes</span>
              </div>
              <div>
                <span className="text-gray-600">Dias Registrados:</span>
                <span className="ml-2 font-bold text-gray-900">{dailyRecords.length} dias</span>
              </div>
              <div>
                <span className="text-gray-600">Calculado em:</span>
                <span className="ml-2 text-gray-900">{new Date(indicators.calculatedAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recalculate Button */}
      {indicators && (
        <div className="text-center">
          <button
            onClick={() => setShowCalculation(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Calculator size={16} className="mr-2" />
            Recalcular Indicadores
          </button>
        </div>
      )}

      {/* Recalculation Modal */}
      {showCalculation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recalcular Indicadores</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  População Base (Residentes no dia 15) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={populacaoBase || indicators?.populacaoBase || 0}
                  onChange={(e) => setPopulacaoBase(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-center"
                  placeholder="Ex: 45"
                  required
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCalculation(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCalculateIndicators}
                  disabled={populacaoBase <= 0}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Calcular
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};