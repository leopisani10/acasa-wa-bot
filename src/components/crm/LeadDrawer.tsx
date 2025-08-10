import React, { useState } from 'react';
import { X, Edit, Phone, MapPin, User, Calendar, Clock, CheckCircle, Plus, MessageCircle } from 'lucide-react';
import { useCRM } from '../../contexts/CRMContext';
import { Lead, Activity, ActivityFormData, ACTIVITY_TYPES } from '../../types/crm';
import { formatPhone, getStageConfig, getActivityTypeConfig } from '../../types/crm';

interface LeadDrawerProps {
  lead: Lead;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
}

export const LeadDrawer: React.FC<LeadDrawerProps> = ({ lead, onClose, onEdit }) => {
  const { getLeadActivities, addActivity, toggleActivity, updateLeadStage } = useCRM();
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityData, setActivityData] = useState<ActivityFormData>({
    type: 'call',
    title: '',
    description: '',
    due_at: '',
  });

  const activities = getLeadActivities(lead.id);
  const stageConfig = getStageConfig(lead.stage);

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addActivity({
        lead_id: lead.id,
        ...activityData,
      } as any);
      
      setShowActivityForm(false);
      setActivityData({
        type: 'call',
        title: '',
        description: '',
        due_at: '',
      });
    } catch (error) {
      alert('Erro ao criar atividade');
    }
  };

  const handleQuickAction = async (type: 'visit' | 'call') => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const activityData = {
      lead_id: lead.id,
      type,
      title: type === 'visit' ? 'Visita agendada' : 'Ligação de follow-up',
      description: type === 'visit' ? 'Visita para conhecer as instalações' : 'Acompanhamento comercial',
      due_at: tomorrow.toISOString(),
    };

    try {
      await addActivity(activityData as any);
      if (type === 'visit' && lead.stage === 'Qualificando') {
        await updateLeadStage(lead.id, 'Agendou visita');
      }
    } catch (error) {
      alert('Erro ao criar atividade');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getActivityIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      Phone,
      MapPin,
      MessageCircle,
      CheckCircle,
    };
    return icons[iconName] || CheckCircle;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end z-50">
      <div className="bg-white h-full w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {lead.contact?.full_name || 'Lead sem nome'}
            </h2>
            <p className="text-gray-600">
              {lead.elderly_name} • {formatPhone(lead.contact?.phone || '')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(lead)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Editar lead"
            >
              <Edit size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto h-full pb-32">
          <div className="p-6 space-y-6">
            {/* Lead Status */}
            <div className="flex items-center justify-between">
              <span className={`px-4 py-2 text-sm font-medium rounded-full ${stageConfig.bgColor} ${stageConfig.textColor}`}>
                {stageConfig.label}
              </span>
              <div className="text-sm text-gray-600">
                Criado em {formatDate(lead.created_at)}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Ações Rápidas</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleQuickAction('call')}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Phone size={16} className="mr-2" />
                  Agendar Ligação
                </button>
                <button
                  onClick={() => handleQuickAction('visit')}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <MapPin size={16} className="mr-2" />
                  Agendar Visita
                </button>
                <a
                  href={`tel:${lead.contact?.phone}`}
                  className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <Phone size={16} className="mr-2" />
                  Ligar Agora
                </a>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Detalhes do Contato</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nome:</span>
                  <span className="font-medium">{lead.contact?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Parentesco:</span>
                  <span className="font-medium">{lead.contact?.relation || 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{lead.contact?.email || 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bairro:</span>
                  <span className="font-medium">{lead.contact?.neighborhood || 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">LGPD:</span>
                  <span className={`font-medium ${lead.contact?.lgpd_consent ? 'text-green-600' : 'text-red-600'}`}>
                    {lead.contact?.lgpd_consent ? 'Autorizado' : 'Não autorizado'}
                  </span>
                </div>
              </div>
            </div>

            {/* Lead Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Detalhes do Lead</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Idoso:</span>
                  <span className="font-medium">{lead.elderly_name || 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Idade:</span>
                  <span className="font-medium">{lead.elderly_age ? `${lead.elderly_age} anos` : 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dependência:</span>
                  <span className="font-medium">Grau {lead.dependency_grade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-medium">{lead.value_band || 'A definir'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Responsável:</span>
                  <span className="font-medium">{lead.owner?.name || 'Não atribuído'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Origem:</span>
                  <span className="font-medium">{lead.source}</span>
                </div>
              </div>
              
              {lead.diagnosis && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">Diagnóstico/Condição</h4>
                  <p className="text-sm text-gray-700">{lead.diagnosis}</p>
                </div>
              )}
            </div>

            {/* Activities Timeline */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Timeline de Atividades</h3>
                <button
                  onClick={() => setShowActivityForm(true)}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus size={16} className="mr-1" />
                  Nova Atividade
                </button>
              </div>

              {activities.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activities.map((activity) => {
                    const typeConfig = getActivityTypeConfig(activity.type);
                    const Icon = getActivityIcon(typeConfig.icon);
                    
                    return (
                      <div key={activity.id} className={`p-3 rounded-lg border ${activity.done ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${activity.done ? 'bg-green-100' : `bg-${typeConfig.color}-100`}`}>
                              <Icon className={`${activity.done ? 'text-green-600' : `text-${typeConfig.color}-600`}`} size={16} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className={`font-medium ${activity.done ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                  {activity.title}
                                </h4>
                                <span className={`px-2 py-1 text-xs font-medium rounded ${activity.done ? 'bg-green-100 text-green-700' : `bg-${typeConfig.color}-100 text-${typeConfig.color}-700`}`}>
                                  {typeConfig.label}
                                </span>
                              </div>
                              {activity.description && (
                                <p className={`text-sm mt-1 ${activity.done ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {activity.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                {activity.due_at && (
                                  <div className="flex items-center">
                                    <Clock size={12} className="mr-1" />
                                    {formatDateTime(activity.due_at)}
                                  </div>
                                )}
                                <div className="flex items-center">
                                  <User size={12} className="mr-1" />
                                  {activity.creator?.name}
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleActivity(activity.id)}
                            className={`p-1 rounded transition-colors ${
                              activity.done 
                                ? 'text-green-600 hover:bg-green-100' 
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={activity.done ? 'Marcar como pendente' : 'Marcar como concluída'}
                          >
                            <CheckCircle size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-600 text-sm">Nenhuma atividade registrada</p>
                </div>
              )}
            </div>

            {/* Activity Form */}
            {showActivityForm && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Nova Atividade</h3>
                <form onSubmit={handleActivitySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo *
                      </label>
                      <select
                        value={activityData.type}
                        onChange={(e) => setActivityData(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        {ACTIVITY_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data/Hora
                      </label>
                      <input
                        type="datetime-local"
                        value={activityData.due_at}
                        onChange={(e) => setActivityData(prev => ({ ...prev, due_at: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={activityData.title}
                      onChange={(e) => setActivityData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Título da atividade"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={activityData.description}
                      onChange={(e) => setActivityData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Detalhes da atividade..."
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowActivityForm(false)}
                      className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Criar Atividade
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};