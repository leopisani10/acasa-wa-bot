import React from 'react';
import { AlertTriangle, TrendingUp, Users, Calendar } from 'lucide-react';
import { useAgravos } from '../../contexts/AgravosContext';

export const AgravosAlerts: React.FC = () => {
  const { getFrequentAgravoAlerts, dailyRecords } = useAgravos();
  
  const alerts = getFrequentAgravoAlerts();
  const lastWeekRecords = dailyRecords.filter(record => {
    const recordDate = new Date(record.date);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return recordDate >= oneWeekAgo;
  });

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return <AlertTriangle className="text-red-600" size={20} />;
      case 'medium': return <TrendingUp className="text-yellow-600" size={20} />;
      case 'low': return <Calendar className="text-blue-600" size={20} />;
      default: return <Calendar className="text-gray-600" size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerts Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Alertas de Agravos</h3>
          <p className="text-sm text-gray-600">Monitoramento de eventos frequentes ou preocupantes</p>
        </div>
        <div className="text-sm text-gray-500">
          Últimos 7 dias • {lastWeekRecords.length} registros
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <div key={index} className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  {getSeverityIcon(alert.severity)}
                  <div className="ml-3">
                    <h4 className="font-semibold">{alert.type}</h4>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-bold">{alert.frequency}x</div>
                  <div className="text-xs">última semana</div>
                </div>
              </div>
              
              <div className="text-sm">
                <div className="mb-2">
                  <strong>Última ocorrência:</strong> {new Date(alert.lastOccurrence).toLocaleDateString('pt-BR')}
                </div>
                <div>
                  <strong>Residentes afetados:</strong> {alert.affectedResidents.join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
            <Users className="text-green-600" size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum Alerta Ativo</h3>
          <p className="text-gray-600">
            Não há padrões preocupantes de agravos na última semana.
          </p>
        </div>
      )}

      {/* Alert Criteria */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Critérios de Alerta</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-red-600 mb-1">Quedas Frequentes</h5>
            <p className="text-gray-600">≥ 5 quedas em 7 dias (qualquer tipo)</p>
          </div>
          <div>
            <h5 className="font-medium text-purple-600 mb-1">Lesões por Pressão</h5>
            <p className="text-gray-600">≥ 3 lesões em 7 dias</p>
          </div>
        </div>
      </div>
    </div>
  );
};