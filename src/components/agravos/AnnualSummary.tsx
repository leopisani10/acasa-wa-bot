import React from 'react';
import { FileText, Download, TrendingUp, Calendar } from 'lucide-react';
import { useAgravos } from '../../contexts/AgravosContext';
import { AnnualAgravosSummary } from '../../types/agravos';

interface AnnualSummaryProps {
  year: number;
  unit: 'Botafogo';
}

export const AnnualSummary: React.FC<AnnualSummaryProps> = ({ year, unit }) => {
  const { generateAnnualSummary, annualSummaries } = useAgravos();

  const summary = annualSummaries.find(s => s.year === year && s.unit === unit) || 
                  generateAnnualSummary(year, unit);

  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  const generateAnnualReport = () => {
    const reportContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resumo Anual de Agravos - ${year}</title>
          <style>
            body { font-family: 'Arial', sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #dc2626; padding-bottom: 20px; }
            .institution { font-size: 24px; font-weight: bold; color: #dc2626; margin-bottom: 10px; }
            .subtitle { font-size: 16px; color: #666; margin-bottom: 5px; }
            .annual-totals { background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #fecaca; }
            .totals-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
            .total-item { text-align: center; padding: 15px; background-color: white; border-radius: 6px; border: 1px solid #e5e7eb; }
            .total-number { font-size: 24px; font-weight: bold; color: #dc2626; }
            .total-label { font-size: 12px; color: #666; margin-top: 5px; }
            .monthly-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .monthly-table th, .monthly-table td { padding: 8px 12px; text-align: center; border: 1px solid #ddd; }
            .monthly-table th { background-color: #dc2626; color: white; font-weight: bold; }
            .monthly-table tr:nth-child(even) { background-color: #f9fafb; }
            .averages-section { background-color: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0; }
            .averages-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
            .average-item { text-align: center; }
            .average-number { font-size: 20px; font-weight: bold; color: #059669; }
            .average-label { font-size: 14px; color: #666; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="institution">ACASA Residencial Sênior</div>
            <div class="subtitle">Resumo Anual de Agravos - ${year}</div>
            <div class="subtitle">Unidade: ${unit}</div>
            <div class="subtitle">Gerado em: ${new Date().toLocaleDateString('pt-BR')}</div>
          </div>

          <div class="annual-totals">
            <h3 style="margin-bottom: 20px; color: #dc2626; font-weight: bold; text-align: center;">Totais Anuais por Tipo de Agravo</h3>
            <div class="totals-grid">
              <div class="total-item">
                <div class="total-number">${summary.totalQuedaComLesao}</div>
                <div class="total-label">Quedas com Lesão</div>
              </div>
              <div class="total-item">
                <div class="total-number">${summary.totalQuedaSemLesao}</div>
                <div class="total-label">Quedas sem Lesão</div>
              </div>
              <div class="total-item">
                <div class="total-number">${summary.totalLesaoPorPressao}</div>
                <div class="total-label">Lesões por Pressão</div>
              </div>
              <div class="total-item">
                <div class="total-number">${summary.totalDiarreia}</div>
                <div class="total-label">Diarreia</div>
              </div>
              <div class="total-item">
                <div class="total-number">${summary.totalEscabiose}</div>
                <div class="total-label">Escabiose</div>
              </div>
              <div class="total-item">
                <div class="total-number">${summary.totalDesidratacao}</div>
                <div class="total-label">Desidratação</div>
              </div>
              <div class="total-item">
                <div class="total-number">${summary.totalObito}</div>
                <div class="total-label">Óbitos</div>
              </div>
              <div class="total-item">
                <div class="total-number">${summary.totalTentativaSuicidio}</div>
                <div class="total-label">Tentativas Suicídio</div>
              </div>
            </div>
          </div>

          <table class="monthly-table">
            <thead>
              <tr>
                <th>Mês</th>
                <th>Pop. Base</th>
                <th>Quedas c/ Lesão</th>
                <th>Quedas s/ Lesão</th>
                <th>Lesões Pressão</th>
                <th>Diarreia</th>
                <th>Escabiose</th>
                <th>Desidratação</th>
                <th>Óbitos</th>
                <th>Tent. Suicídio</th>
              </tr>
            </thead>
            <tbody>
              ${summary.monthlyData.map(monthData => `
                <tr>
                  <td><strong>${monthNames[monthData.month - 1]}</strong></td>
                  <td>${monthData.populacaoBase}</td>
                  <td>${monthData.totalQuedaComLesao}</td>
                  <td>${monthData.totalQuedaSemLesao}</td>
                  <td>${monthData.totalLesaoPorPressao}</td>
                  <td>${monthData.totalDiarreia}</td>
                  <td>${monthData.totalEscabiose}</td>
                  <td>${monthData.totalDesidratacao}</td>
                  <td>${monthData.totalObito}</td>
                  <td>${monthData.totalTentativaSuicidio}</td>
                </tr>
              `).join('')}
              <tr style="background-color: #dc2626; color: white; font-weight: bold;">
                <td>TOTAL ANUAL</td>
                <td>-</td>
                <td>${summary.totalQuedaComLesao}</td>
                <td>${summary.totalQuedaSemLesao}</td>
                <td>${summary.totalLesaoPorPressao}</td>
                <td>${summary.totalDiarreia}</td>
                <td>${summary.totalEscabiose}</td>
                <td>${summary.totalDesidratacao}</td>
                <td>${summary.totalObito}</td>
                <td>${summary.totalTentativaSuicidio}</td>
              </tr>
            </tbody>
          </table>

          <div class="averages-section">
            <h3 style="margin-bottom: 20px; color: #059669; font-weight: bold; text-align: center;">Médias Anuais dos Indicadores</h3>
            <div class="averages-grid">
              <div class="average-item">
                <div class="average-number">${summary.mediaAnualMortalidade.toFixed(2)}</div>
                <div class="average-label">Taxa Mortalidade Média</div>
              </div>
              <div class="average-item">
                <div class="average-number">${summary.mediaAnualIncidenciaDiarreia.toFixed(2)}</div>
                <div class="average-label">Incidência Diarreia Média</div>
              </div>
              <div class="average-item">
                <div class="average-number">${summary.mediaAnualIncidenciaEscabiose.toFixed(2)}</div>
                <div class="average-label">Incidência Escabiose Média</div>
              </div>
              <div class="average-item">
                <div class="average-number">${summary.mediaAnualPrevalenciaLesaoPressao.toFixed(2)}</div>
                <div class="average-label">Prevalência Lesão Pressão Média</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p><strong>ACASA Residencial Sênior</strong> - Resumo Anual de Agravos</p>
            <p>Este documento consolida todos os agravos registrados durante o ano de ${year}</p>
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

  const totalAnnualEvents = summary.totalQuedaComLesao + summary.totalQuedaSemLesao + 
                          summary.totalLesaoPorPressao + summary.totalDiarreia + 
                          summary.totalEscabiose + summary.totalDesidratacao + 
                          summary.totalObito + summary.totalTentativaSuicidio;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="text-green-600 mr-3" size={20} />
            <div>
              <h3 className="font-semibold text-green-800">
                Resumo Anual de Agravos - {year}
              </h3>
              <p className="text-sm text-green-600">
                {unit} • {summary.monthlyData.length} meses com dados • {totalAnnualEvents} eventos totais
              </p>
            </div>
          </div>
          <button
            onClick={generateAnnualReport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={16} className="mr-2" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Annual Totals */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="mr-2 text-red-600" size={20} />
          Totais Anuais por Tipo de Agravo
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">{summary.totalQuedaComLesao}</div>
            <div className="text-xs text-gray-600">Quedas c/ Lesão</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{summary.totalQuedaSemLesao}</div>
            <div className="text-xs text-gray-600">Quedas s/ Lesão</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{summary.totalLesaoPorPressao}</div>
            <div className="text-xs text-gray-600">Lesões Pressão</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">{summary.totalDiarreia}</div>
            <div className="text-xs text-gray-600">Diarreia</div>
          </div>
          <div className="text-center p-4 bg-pink-50 rounded-lg border border-pink-200">
            <div className="text-2xl font-bold text-pink-600">{summary.totalEscabiose}</div>
            <div className="text-xs text-gray-600">Escabiose</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{summary.totalDesidratacao}</div>
            <div className="text-xs text-gray-600">Desidratação</div>
          </div>
          <div className="text-center p-4 bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-white">{summary.totalObito}</div>
            <div className="text-xs text-gray-300">Óbitos</div>
          </div>
          <div className="text-center p-4 bg-red-800 rounded-lg">
            <div className="text-2xl font-bold text-white">{summary.totalTentativaSuicidio}</div>
            <div className="text-xs text-gray-300">Tent. Suicídio</div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900">Distribuição Mensal</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-red-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Mês</th>
                <th className="px-4 py-3 text-center">Pop. Base</th>
                <th className="px-4 py-3 text-center">Quedas c/ Lesão</th>
                <th className="px-4 py-3 text-center">Quedas s/ Lesão</th>
                <th className="px-4 py-3 text-center">Lesões Pressão</th>
                <th className="px-4 py-3 text-center">Diarreia</th>
                <th className="px-4 py-3 text-center">Escabiose</th>
                <th className="px-4 py-3 text-center">Desidratação</th>
                <th className="px-4 py-3 text-center">Óbitos</th>
                <th className="px-4 py-3 text-center">Tent. Suicídio</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                const monthData = summary.monthlyData.find(m => m.month === month);
                return (
                  <tr key={month} className={month % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3 font-medium">{monthNames[month - 1]}</td>
                    <td className="px-4 py-3 text-center">{monthData?.populacaoBase || '-'}</td>
                    <td className="px-4 py-3 text-center">{monthData?.totalQuedaComLesao || 0}</td>
                    <td className="px-4 py-3 text-center">{monthData?.totalQuedaSemLesao || 0}</td>
                    <td className="px-4 py-3 text-center">{monthData?.totalLesaoPorPressao || 0}</td>
                    <td className="px-4 py-3 text-center">{monthData?.totalDiarreia || 0}</td>
                    <td className="px-4 py-3 text-center">{monthData?.totalEscabiose || 0}</td>
                    <td className="px-4 py-3 text-center">{monthData?.totalDesidratacao || 0}</td>
                    <td className="px-4 py-3 text-center">{monthData?.totalObito || 0}</td>
                    <td className="px-4 py-3 text-center">{monthData?.totalTentativaSuicidio || 0}</td>
                  </tr>
                );
              })}
              <tr className="bg-red-600 text-white font-bold">
                <td className="px-4 py-3">TOTAL ANUAL</td>
                <td className="px-4 py-3 text-center">-</td>
                <td className="px-4 py-3 text-center">{summary.totalQuedaComLesao}</td>
                <td className="px-4 py-3 text-center">{summary.totalQuedaSemLesao}</td>
                <td className="px-4 py-3 text-center">{summary.totalLesaoPorPressao}</td>
                <td className="px-4 py-3 text-center">{summary.totalDiarreia}</td>
                <td className="px-4 py-3 text-center">{summary.totalEscabiose}</td>
                <td className="px-4 py-3 text-center">{summary.totalDesidratacao}</td>
                <td className="px-4 py-3 text-center">{summary.totalObito}</td>
                <td className="px-4 py-3 text-center">{summary.totalTentativaSuicidio}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Average Rates */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="mr-2 text-green-600" size={20} />
          Médias Anuais dos Indicadores
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-xl font-bold text-green-600">{summary.mediaAnualMortalidade.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Taxa Mortalidade Média</div>
            <div className="text-xs text-gray-500">por 1000 residentes/mês</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-xl font-bold text-green-600">{summary.mediaAnualIncidenciaDiarreia.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Incidência Diarreia Média</div>
            <div className="text-xs text-gray-500">por 1000 residentes/mês</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-xl font-bold text-green-600">{summary.mediaAnualIncidenciaEscabiose.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Incidência Escabiose Média</div>
            <div className="text-xs text-gray-500">por 1000 residentes/mês</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-xl font-bold text-green-600">{summary.mediaAnualIncidenciaDesidratacao.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Incidência Desidratação Média</div>
            <div className="text-xs text-gray-500">por 1000 residentes/mês</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-xl font-bold text-green-600">{summary.mediaAnualPrevalenciaLesaoPressao.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Prevalência Lesão Pressão Média</div>
            <div className="text-xs text-gray-500">por 1000 residentes/mês</div>
          </div>
        </div>
      </div>
    </div>
  );
};