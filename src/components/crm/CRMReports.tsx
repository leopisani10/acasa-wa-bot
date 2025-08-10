import React, { useState, useMemo } from 'react';
import { BarChart3, PieChart, TrendingUp, Users, Target, Calendar, Download, Filter } from 'lucide-react';
import { useCRM } from '../../contexts/CRMContext';
import { CRMReportData, ConversionStats, LEAD_STAGES } from '../../types/crm';

export const CRMReports: React.FC = () => {
  const { leads, activities, units } = useCRM();
  const [periodFilter, setPeriodFilter] = useState<'7' | '30' | '90'>('30');
  const [unitFilter, setUnitFilter] = useState<string>('all');

  const reportData = useMemo((): CRMReportData => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - (parseInt(periodFilter) * 24 * 60 * 60 * 1000));
    
    // Filter leads by period and unit
    const filteredLeads = leads.filter(lead => {
      const leadDate = new Date(lead.created_at);
      const unitMatch = unitFilter === 'all' || lead.contact?.unit_id === unitFilter;
      return leadDate >= daysAgo && unitMatch;
    });

    // Stage statistics
    const stage_stats = LEAD_STAGES.map(stage => {
      const count = filteredLeads.filter(lead => lead.stage === stage.value).length;
      const percentage = filteredLeads.length > 0 ? (count / filteredLeads.length) * 100 : 0;
      return {
        stage: stage.value,
        count,
        percentage,
      };
    });

    // Conversion statistics
    const total_leads = filteredLeads.length;
    const visited = filteredLeads.filter(l => l.stage === 'Visitou' || l.stage === 'Proposta' || l.stage === 'Fechado').length;
    const proposals = filteredLeads.filter(l => l.stage === 'Proposta' || l.stage === 'Fechado').length;
    const closed = filteredLeads.filter(l => l.stage === 'Fechado').length;

    const conversion_stats: ConversionStats = {
      total_leads,
      visited,
      proposals,
      closed,
      visit_rate: total_leads > 0 ? (visited / total_leads) * 100 : 0,
      proposal_rate: visited > 0 ? (proposals / visited) * 100 : 0,
      close_rate: proposals > 0 ? (closed / proposals) * 100 : 0,
    };

    // Recent activities
    const recent_activities = activities
      .filter(activity => {
        const activityDate = new Date(activity.created_at);
        return activityDate >= daysAgo;
      })
      .slice(0, 10);

    // Sources
    const sourceCounts = filteredLeads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const top_sources = Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // Period summary
    const period_summary = {
      new_leads: filteredLeads.filter(l => l.stage === 'Novo').length,
      closed_deals: filteredLeads.filter(l => l.stage === 'Fechado').length,
      lost_deals: filteredLeads.filter(l => l.stage === 'Perdido').length,
      in_progress: filteredLeads.filter(l => !['Fechado', 'Perdido'].includes(l.stage)).length,
    };

    return {
      stage_stats,
      conversion_stats,
      recent_activities,
      top_sources,
      period_summary,
    };
  }, [leads, activities, periodFilter, unitFilter]);

  const exportReport = () => {
    const reportContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório CRM - ACASA</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
            .institution { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 24px; font-weight: bold; color: #2563eb; }
            .stat-label { font-size: 14px; color: #666; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background-color: #2563eb; color: white; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="institution">ACASA Residencial Sênior</div>
            <div>Relatório CRM - Últimos ${periodFilter} dias</div>
            <div>Gerado em: ${new Date().toLocaleDateString('pt-BR')}</div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${reportData.period_summary.new_leads}</div>
              <div class="stat-label">Novos Leads</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${reportData.period_summary.closed_deals}</div>
              <div class="stat-label">Fechamentos</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${reportData.conversion_stats.close_rate.toFixed(1)}%</div>
              <div class="stat-label">Taxa Conversão</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${reportData.period_summary.in_progress}</div>
              <div class="stat-label">Em Andamento</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Leads por Estágio</div>
            <table>
              <thead>
                <tr><th>Estágio</th><th>Quantidade</th><th>Percentual</th></tr>
              </thead>
              <tbody>
                ${reportData.stage_stats.map(stat => `
                  <tr>
                    <td>${stat.stage}</td>
                    <td>${stat.count}</td>
                    <td>${stat.percentage.toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p><strong>ACASA Residencial Sênior</strong> - Sistema CRM</p>
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
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full">
            <BarChart3 className="text-white" size={32} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios CRM</h1>
        <p className="text-gray-600">Análise de performance e conversão de leads</p>
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
              </select>
            </div>
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as Unidades</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={exportReport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              <p className="text-sm text-gray-600 font-medium">Novos Leads</p>
              <p className="text-3xl font-bold text-blue-600">{reportData.period_summary.new_leads}</p>
            </div>
            <Users className="text-blue-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Fechamentos</p>
              <p className="text-3xl font-bold text-green-600">{reportData.period_summary.closed_deals}</p>
            </div>
            <Target className="text-green-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Taxa Conversão</p>
              <p className="text-3xl font-bold text-purple-600">{reportData.conversion_stats.close_rate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="text-purple-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Em Andamento</p>
              <p className="text-3xl font-bold text-orange-600">{reportData.period_summary.in_progress}</p>
            </div>
            <Calendar className="text-orange-600" size={24} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="mr-2 text-blue-600" size={20} />
            Distribuição por Estágio
          </h3>
          <div className="space-y-3">
            {reportData.stage_stats.map(stat => {
              const stageConfig = LEAD_STAGES.find(s => s.value === stat.stage);
              return (
                <div key={stat.stage} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded mr-3 bg-${stageConfig?.color}-500`}></div>
                    <span className="text-sm font-medium text-gray-900">{stat.stage}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-gray-900">{stat.count}</span>
                    <span className="text-sm text-gray-600">{stat.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
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
              <span className="text-sm font-medium text-blue-900">Total de Leads</span>
              <span className="text-lg font-bold text-blue-600">{reportData.conversion_stats.total_leads}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-900">Visitaram</span>
              <div className="text-right">
                <span className="text-lg font-bold text-purple-600">{reportData.conversion_stats.visited}</span>
                <div className="text-xs text-purple-600">{reportData.conversion_stats.visit_rate.toFixed(1)}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-orange-900">Receberam Proposta</span>
              <div className="text-right">
                <span className="text-lg font-bold text-orange-600">{reportData.conversion_stats.proposals}</span>
                <div className="text-xs text-orange-600">{reportData.conversion_stats.proposal_rate.toFixed(1)}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-900">Fecharam</span>
              <div className="text-right">
                <span className="text-lg font-bold text-green-600">{reportData.conversion_stats.closed}</span>
                <div className="text-xs text-green-600">{reportData.conversion_stats.close_rate.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sources and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sources */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Principais Origens</h3>
          <div className="space-y-3">
            {reportData.top_sources.length > 0 ? (
              reportData.top_sources.map(source => (
                <div key={source.source} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{source.source}</span>
                  <span className="text-sm font-bold text-gray-900">{source.count} leads</span>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-sm">Nenhuma origem registrada no período</p>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividades Recentes</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {reportData.recent_activities.length > 0 ? (
              reportData.recent_activities.map(activity => (
                <div key={activity.id} className="flex items-center space-x-3 p-2 border-l-4 border-blue-200 bg-blue-50">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{activity.title}</div>
                    <div className="text-xs text-gray-600">
                      {activity.creator?.name} • {new Date(activity.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${activity.done ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-sm">Nenhuma atividade no período</p>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Estatísticas Detalhadas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left">Estágio</th>
                <th className="px-6 py-3 text-center">Quantidade</th>
                <th className="px-6 py-3 text-center">Percentual</th>
                <th className="px-6 py-3 text-center">Tendência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.stage_stats.map((stat, index) => {
                const stageConfig = LEAD_STAGES.find(s => s.value === stat.stage);
                return (
                  <tr key={stat.stage} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded mr-3 bg-${stageConfig?.color}-500`}></div>
                        <span className="font-medium text-gray-900">{stat.stage}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900">{stat.count}</td>
                    <td className="px-6 py-4 text-center text-gray-700">{stat.percentage.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-center">
                      <TrendingUp className="text-gray-400 mx-auto" size={16} />
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