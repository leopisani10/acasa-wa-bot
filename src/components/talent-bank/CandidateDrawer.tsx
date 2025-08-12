import React, { useState } from 'react';
import { X, Edit, Phone, Mail, MapPin, User, Calendar, Clock, CheckCircle, Plus, Briefcase, Target } from 'lucide-react';
import { useTalentBank } from '../../contexts/TalentBankContext';
import { Candidate, CandidateActivity, ActivityFormData, ACTIVITY_TYPES_TALENT } from '../../types/talentBank';
import { formatCandidatePhone, getStatusConfig, getActivityTypeConfig, calculateDaysInPipeline } from '../../types/talentBank';

interface CandidateDrawerProps {
  candidate: Candidate;
  onClose: () => void;
  onEdit: (candidate: Candidate) => void;
}

export const CandidateDrawer: React.FC<CandidateDrawerProps> = ({ candidate, onClose, onEdit }) => {
  const { getCandidateActivities, addActivity, completeActivity, updateCandidateStatus } = useTalentBank();
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityData, setActivityData] = useState<ActivityFormData>({
    type: 'Ligação',
    title: '',
    description: '',
    scheduled_at: '',
    status: 'Pendente',
  });

  const activities = getCandidateActivities(candidate.id);
  const statusConfig = getStatusConfig(candidate.status);
  const daysInPipeline = calculateDaysInPipeline(candidate.created_at);

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addActivity({
        candidate_id: candidate.id,
        ...activityData,
      } as any);
      
      setShowActivityForm(false);
      setActivityData({
        type: 'Ligação',
        title: '',
        description: '',
        scheduled_at: '',
        status: 'Pendente',
      });
    } catch (error) {
      alert('Erro ao criar atividade');
    }
  };

  const handleQuickAction = async (type: 'Entrevista' | 'Ligação') => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const activityData = {
      candidate_id: candidate.id,
      type,
      title: type === 'Entrevista' ? 'Entrevista agendada' : 'Ligação de contato',
      description: type === 'Entrevista' ? 'Entrevista presencial ou online' : 'Ligação para contato inicial',
      scheduled_at: tomorrow.toISOString(),
      status: 'Pendente' as any,
    };

    try {
      await addActivity(activityData as any);
      if (type === 'Entrevista' && candidate.status === 'Triagem') {
        await updateCandidateStatus(candidate.id, 'Entrevista Agendada');
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
      Mail,
      MessageCircle: Mail,
      Video: Calendar,
      CheckSquare: CheckCircle,
      FileText: Edit,
    };
    return icons[iconName] || CheckCircle;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end z-50">
      <div className="bg-white h-full w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-green-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {candidate.full_name}
            </h2>
            <p className="text-gray-600">
              {candidate.desired_position} • {formatCandidatePhone(candidate.phone)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(candidate)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Editar candidato"
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
            {/* Candidate Status */}
            <div className="flex items-center justify-between">
              <span className={`px-4 py-2 text-sm font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                {statusConfig.label}
              </span>
              <div className="text-sm text-gray-600 text-right">
                <div>Criado em {formatDate(candidate.created_at)}</div>
                <div className="text-xs text-gray-500">{daysInPipeline} dias no pipeline</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Ações Rápidas</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleQuickAction('Ligação')}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Phone size={16} className="mr-2" />
                  Agendar Ligação
                </button>
                <button
                  onClick={() => handleQuickAction('Entrevista')}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Calendar size={16} className="mr-2" />
                  Agendar Entrevista
                </button>
                <a
                  href={`tel:${candidate.phone}`}
                  className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <Phone size={16} className="mr-2" />
                  Ligar Agora
                </a>
                <a
                  href={`mailto:${candidate.email}`}
                  className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  <Mail size={16} className="mr-2" />
                  Enviar Email
                </a>
              </div>
            </div>

            {/* Candidate Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Detalhes do Candidato</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nome:</span>
                  <span className="font-medium">{candidate.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{candidate.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Telefone:</span>
                  <span className="font-medium">{formatCandidatePhone(candidate.phone)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cargo:</span>
                  <span className="font-medium">{candidate.desired_position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Experiência:</span>
                  <span className="font-medium">{candidate.experience_years} anos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Localização:</span>
                  <span className="font-medium">{candidate.city}, {candidate.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Disponibilidade:</span>
                  <span className="font-medium">{candidate.availability || 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pretensão:</span>
                  <span className="font-medium">{candidate.salary_expectation || 'A combinar'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Origem:</span>
                  <span className="font-medium">{candidate.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">LGPD:</span>
                  <span className={`font-medium ${candidate.lgpd_consent ? 'text-green-600' : 'text-red-600'}`}>
                    {candidate.lgpd_consent ? 'Autorizado' : 'Não autorizado'}
                  </span>
                </div>
              </div>
              
              {candidate.curriculum_url && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-1">Currículo</h4>
                  <a 
                    href={candidate.curriculum_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Visualizar currículo →
                  </a>
                </div>
              )}

              {candidate.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">Observações Internas</h4>
                  <p className="text-sm text-gray-700">{candidate.notes}</p>
                </div>
              )}
            </div>

            {/* Activities Timeline */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Timeline de Atividades</h3>
                <button
                  onClick={() => setShowActivityForm(true)}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
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
                      <div key={activity.id} className={`p-3 rounded-lg border ${
                        activity.status === 'Concluída' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${
                              activity.status === 'Concluída' ? 'bg-green-100' : `bg-${typeConfig.color}-100`
                            }`}>
                              <Icon className={`${
                                activity.status === 'Concluída' ? 'text-green-600' : `text-${typeConfig.color}-600`
                              }`} size={16} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className={`font-medium ${
                                  activity.status === 'Concluída' ? 'line-through text-gray-500' : 'text-gray-900'
                                }`}>
                                  {activity.title}
                                </h4>
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  activity.status === 'Concluída' ? 'bg-green-100 text-green-700' : `bg-${typeConfig.color}-100 text-${typeConfig.color}-700`
                                }`}>
                                  {typeConfig.label}
                                </span>
                              </div>
                              {activity.description && (
                                <p className={`text-sm mt-1 ${
                                  activity.status === 'Concluída' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {activity.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                {activity.scheduled_at && (
                                  <div className="flex items-center">
                                    <Clock size={12} className="mr-1" />
                                    {formatDateTime(activity.scheduled_at)}
                                  </div>
                                )}
                                <div className="flex items-center">
                                  <User size={12} className="mr-1" />
                                  {activity.creator?.name || 'Sistema'}
                                </div>
                              </div>
                            </div>
                          </div>
                          {activity.status !== 'Concluída' && (
                            <button
                              onClick={() => completeActivity(activity.id)}
                              className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-100 rounded transition-colors"
                              title="Marcar como concluída"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      >
                        {ACTIVITY_TYPES_TALENT.map(type => (
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
                        value={activityData.scheduled_at}
                        onChange={(e) => setActivityData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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