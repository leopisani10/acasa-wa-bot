import React, { useState } from 'react';
import { Kanban, Filter, User, Phone, Calendar, Building, Users } from 'lucide-react';
import { useTalentBank } from '../../contexts/TalentBankContext';
import { Candidate, CandidateStatus, CANDIDATE_STATUSES } from '../../types/talentBank';
import { formatCandidatePhone, getStatusConfig, calculateDaysInPipeline } from '../../types/talentBank';

export const TalentBankPipeline: React.FC = () => {
  const { filteredCandidates, updateCandidateStatus, setFilters, filters } = useTalentBank();
  const [draggedCandidate, setDraggedCandidate] = useState<Candidate | null>(null);

  // Group candidates by status
  const candidatesByStatus = CANDIDATE_STATUSES.reduce((acc, status) => {
    acc[status.value] = filteredCandidates.filter(candidate => candidate.status === status.value);
    return acc;
  }, {} as Record<CandidateStatus, Candidate[]>);

  const handleDragStart = (e: React.DragEvent, candidate: Candidate) => {
    setDraggedCandidate(candidate);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: CandidateStatus) => {
    e.preventDefault();
    
    if (draggedCandidate && draggedCandidate.status !== targetStatus) {
      try {
        await updateCandidateStatus(draggedCandidate.id, targetStatus);
      } catch (error) {
        alert('Erro ao atualizar status do candidato');
      }
    }
    
    setDraggedCandidate(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-full">
            <Kanban className="text-white" size={32} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pipeline de Seleção</h1>
        <p className="text-gray-600">Acompanhe o progresso dos candidatos no processo seletivo</p>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {filteredCandidates.length} candidatos no pipeline
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>Novos: {candidatesByStatus['Novo']?.length || 0}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Contratados: {candidatesByStatus['Contratado']?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-x-auto">
        <div className="flex space-x-6 min-w-max">
          {CANDIDATE_STATUSES.map((status) => {
            const statusCandidates = candidatesByStatus[status.value] || [];
            
            return (
              <div
                key={status.value}
                className="flex-shrink-0 w-80"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status.value)}
              >
                {/* Column Header */}
                <div className={`${status.bgColor} border-2 border-dashed border-${status.color}-300 rounded-lg p-4 mb-4`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${status.textColor}`}>
                      {status.label}
                    </h3>
                    <div className={`px-2 py-1 ${status.bgColor} ${status.textColor} rounded-full text-xs font-bold`}>
                      {statusCandidates.length}
                    </div>
                  </div>
                  <p className="text-xs mt-1 text-gray-600">{status.description}</p>
                </div>

                {/* Candidate Cards */}
                <div className="space-y-3 min-h-[400px]">
                  {statusCandidates.map((candidate, index) => (
                    <div
                      key={candidate.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, candidate)}
                      className="bg-white border border-gray-200 rounded-lg p-4 cursor-move hover:shadow-md transition-all duration-200 transform hover:scale-105"
                    >
                      {/* Candidate Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm leading-tight">
                            {candidate.full_name}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {candidate.desired_position}
                          </p>
                        </div>
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                          {candidate.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                      </div>

                      {/* Candidate Info */}
                      <div className="space-y-2 text-xs text-gray-600">
                        <div className="flex items-center">
                          <Phone size={12} className="mr-2" />
                          <span className="font-mono">
                            {formatCandidatePhone(candidate.phone)}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <Building size={12} className="mr-2" />
                          <span>{candidate.city}, {candidate.state}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <User size={12} className="mr-2" />
                          <span>{candidate.experience_years} anos de experiência</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Calendar size={12} className="mr-2" />
                          <span>{calculateDaysInPipeline(candidate.created_at)} dias no pipeline</span>
                        </div>
                      </div>

                      {/* Candidate Footer */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            {candidate.source}
                          </div>
                          {candidate.availability && (
                            <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                              {candidate.availability}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Empty State */}
                  {statusCandidates.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-4xl mb-2">👤</div>
                      <p className="text-sm">Nenhum candidato neste estágio</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline Instructions */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">Como usar o Pipeline</h3>
        <div className="text-sm text-green-800 space-y-1">
          <p>• Arraste os cards de candidatos entre as colunas para atualizar o status</p>
          <p>• Cada movimento é salvo automaticamente no sistema</p>
          <p>• Use os filtros para focar em cargos ou localizações específicas</p>
          <p>• O contador em cada coluna mostra quantos candidatos estão naquele estágio</p>
        </div>
      </div>
    </div>
  );
};