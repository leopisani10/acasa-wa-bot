import React, { useState, useMemo } from 'react';
import { BarChart3, PieChart, TrendingUp, Users, Target, Calendar, Download, Filter } from 'lucide-react';
import { useTalentBank } from '../../contexts/TalentBankContext';
import { CandidateStats, CANDIDATE_STATUSES } from '../../types/talentBank';

export const TalentBankReports: React.FC = () => {
  const { candidates, activities } = useTalentBank();
  const [periodFilter, setPeriodFilter] = useState<'7' | '30' | '90'>('30');

  const reportData = useMemo((): CandidateStats => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - (parseInt(periodFilter) * 24 * 60 * 60 * 1000));
    
    // Filter candidates by period
    const filteredCandidates = candidates.filter(candidate => {
      const candidateDate = new Date(candidate.created_at);
      return candidateDate >= daysAgo;
    });

    // Status statistics
    const by_status = CANDIDATE_STATUSES.map(status => ({
      status: status.value,
      count: candidates.filter(candidate => candidate.status === status.value).length,
    }));

    // Position statistics
    const positionCounts = candidates.reduce((acc, candidate) => {
      acc[candidate.desired_position] = (acc[candidate.desired_position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const by_position = Object.entries(positionCounts)
      .map(([position, count]) => ({ position, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Source statistics
    const sourceCounts = candidates.reduce((acc, candidate) => {
      acc[candidate.source] = (acc[candidate.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const by_source = Object.entries(sourceCounts)
      .map(([source, count]) => ({ source: source as any, count }))
      .sort((a, b) => b.count - a.count);

    const total_candidates = candidates.length;
    const recent_candidates = filteredCandidates.length;
    const contracted = candidates.filter(c => c.status === 'Contratado').length;
    const conversion_rate = total_candidates > 0 ? (contracted / total_candidates) * 100 : 0;

    return {
      total_candidates,
      by_status,
      by_position,
      by_source,
      recent_candidates,
      conversion_rate,
    };
  }, [candidates, activities, periodFilter]);

  const exportReport = () => {
    const reportContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório Banco de Talentos - ACASA</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #22c55e; padding-bottom: 20px; }
            .institution { font-size: 24px; font-weight: bold; color: #22c55e; margin-bottom: 10px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 24px; font-weight: bold; color: #22c55e; }
            .stat-label { font-size: 14px; color: #666; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background-color: #22c55e; color: white; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="institution">ACASA Residencial Sênior</div>
            <div>Relatório Banco de Talentos - Últimos ${periodFilter} dias</div>
            <div>Gerado em: ${new Date().toLocaleDateString('pt-BR')}</div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${reportData.total_candidates}</div>
              <div class="stat-label">Total Candidatos</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${reportData.recent_candidates}</div>
              <div class="stat-label">Novos (${periodFilter} dias)</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${reportData.by_status.find(s => s.status === 'Contratado')?.count || 0}</div>
              <div class="stat-label">Contratados</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${reportData.conversion_rate.toFixed(1)}%</div>
              <div class="stat-label">Taxa Conversão</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Candidatos por Status</div>
            <table>
              <thead>
                <tr><th>Status</th><th>Quantidade</th><th>Percentual</th></tr>
              </thead>
              <tbody>
                ${reportData.by_status.map(stat => {
                  const percentage = reportData.total_candidates > 0 ? (stat.count / reportData.total_candidates) * 100 : 0;
                  return `
                    <tr>
                      <td>${stat.status}</td>
                      <td>${stat.count}</td>
                      <td>${percentage.toFixed(1)}%</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Candidatos por Cargo</div>
            <table>
              <thead>
                <tr><th>Cargo</th><th>Quantidade</th></tr>
              </thead>
              <tbody>
                ${reportData.by_position.map(stat => `
                  <tr>
                    <td>${stat.position}</td>
                    <td>${stat.count}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p><strong>ACASA Residencial Sênior</strong> - Sistema de Banco de Talentos</p>
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
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-full">
            <BarChart3 className="text-white" size={32} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios RH</h1>
        <p className="text-gray-600">Análise de performance e métricas do banco de talentos</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Filter className="text-gray-600 mr-2" size={18} />
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
              </select>
            </div>
          </div>
          <button
            onClick={exportReport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={18} className="mr-2" />
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Candidatos</p>
              <p className="text-3xl font-bold text-green-600">{reportData.total_candidates}</p>
            </div>
            <Users className="text-green-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Novos ({periodFilter} dias)</p>
              <p className="text-3xl font-bold text-blue-600">{reportData.recent_candidates}</p>
            </div>
            <Calendar className="text-blue-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Contratados</p>
              <p className="text-3xl font-bold text-emerald-600">
                {reportData.by_status.find(s => s.status === 'Contratado')?.count || 0}
              </p>
            </div>
            <Target className="text-emerald-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Taxa Conversão</p>
              <p className="text-3xl font-bold text-purple-600">{reportData.conversion_rate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="text-purple-600" size={24} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="mr-2 text-green-600" size={20} />
            Distribuição por Status
          </h3>
          <div className="space-y-3">
            {reportData.by_status.map(stat => {
              const statusConfig = CANDIDATE_STATUSES.find(s => s.value === stat.status);
              const percentage = reportData.total_candidates > 0 ? (stat.count / reportData.total_candidates) * 100 : 0;
              return (
                <div key={stat.status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded mr-3 bg-${statusConfig?.color}-500`}></div>
                    <span className="text-sm font-medium text-gray-900">{stat.status}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-gray-900">{stat.count}</span>
                    <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Position Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="mr-2 text-blue-600" size={20} />
            Top Cargos Procurados
          </h3>
          <div className="space-y-3">
            {reportData.by_position.slice(0, 8).map(stat => (
              <div key={stat.position} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{stat.position}</span>
                <span className="text-sm font-bold text-gray-900">{stat.count} candidatos</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sources and Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sources */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Principais Origens</h3>
          <div className="space-y-3">
            {reportData.by_source.length > 0 ? (
              reportData.by_source.map(source => (
                <div key={source.source} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{source.source}</span>
                  <span className="text-sm font-bold text-gray-900">{source.count} candidatos</span>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-sm">Nenhuma origem registrada</p>
            )}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="mr-2 text-green-600" size={20} />
            Funil de Conversão
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-900">Total de Candidatos</span>
              <span className="text-lg font-bold text-blue-600">{reportData.total_candidates}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-900">Em Triagem</span>
              <div className="text-right">
                <span className="text-lg font-bold text-purple-600">
                  {reportData.by_status.find(s => s.status === 'Triagem')?.count || 0}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
              <span className="text-sm font-medium text-indigo-900">Entrevistas</span>
              <div className="text-right">
                <span className="text-lg font-bold text-indigo-600">
                  {(reportData.by_status.find(s => s.status === 'Entrevista Agendada')?.count || 0) +
                   (reportData.by_status.find(s => s.status === 'Entrevistado')?.count || 0)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <span className="text-sm font-medium text-emerald-900">Contratados</span>
              <div className="text-right">
                <span className="text-lg font-bold text-emerald-600">
                  {reportData.by_status.find(s => s.status === 'Contratado')?.count || 0}
                </span>
                <div className="text-xs text-emerald-600">{reportData.conversion_rate.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Estatísticas Detalhadas por Status</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-green-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-center">Quantidade</th>
                <th className="px-6 py-3 text-center">Percentual</th>
                <th className="px-6 py-3 text-center">Descrição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.by_status.map((stat, index) => {
                const statusConfig = CANDIDATE_STATUSES.find(s => s.value === stat.status);
                const percentage = reportData.total_candidates > 0 ? (stat.count / reportData.total_candidates) * 100 : 0;
                return (
                  <tr key={stat.status} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded mr-3 bg-${statusConfig?.color}-500`}></div>
                        <span className="font-medium text-gray-900">{stat.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900">{stat.count}</td>
                    <td className="px-6 py-4 text-center text-gray-700">{percentage.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      {statusConfig?.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};