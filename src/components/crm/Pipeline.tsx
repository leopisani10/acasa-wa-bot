import React, { useState } from 'react';
import { Kanban, Filter, User, Phone, MapPin, Calendar, Contrast as DragDropContext, Droplet as Droppable, Cable as Draggable } from 'lucide-react';
import { useCRM } from '../../contexts/CRMContext';
import { Lead, LeadStage, LEAD_STAGES } from '../../types/crm';
import { formatPhone, getStageConfig } from '../../types/crm';

export const Pipeline: React.FC = () => {
  const { filteredLeads, updateLeadStage, units, setFilters, filters } = useCRM();
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  // Group leads by stage
  const leadsByStage = LEAD_STAGES.reduce((acc, stage) => {
    acc[stage.value] = filteredLeads.filter(lead => lead.stage === stage.value);
    return acc;
  }, {} as Record<LeadStage, Lead[]>);

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStage: LeadStage) => {
    e.preventDefault();
    
    if (draggedLead && draggedLead.stage !== targetStage) {
      try {
        await updateLeadStage(draggedLead.id, targetStage);
      } catch (error) {
        alert('Erro ao atualizar estágio do lead');
      }
    }
    
    setDraggedLead(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full">
            <Kanban className="text-white" size={32} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pipeline de Vendas</h1>
        <p className="text-gray-600">Acompanhe o progresso dos leads no funil de vendas</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center">
            <Filter className="text-gray-600 mr-2" size={18} />
            <select
              value={filters.unit_id || ''}
              onChange={(e) => setFilters({ ...filters, unit_id: e.target.value || undefined })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as Unidades</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 text-sm text-gray-600">
            {filteredLeads.length} leads no pipeline
          </div>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-x-auto">
        <div className="flex space-x-6 min-w-max">
          {LEAD_STAGES.map((stage) => {
            const stageLeads = leadsByStage[stage.value] || [];
            
            return (
              <div
                key={stage.value}
                className="flex-shrink-0 w-80"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.value)}
              >
                {/* Column Header */}
                <div className={`${stage.bgColor} border-2 border-dashed border-${stage.color}-300 rounded-lg p-4 mb-4`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${stage.textColor}`}>
                      {stage.label}
                    </h3>
                    <div className={`px-2 py-1 ${stage.bgColor} ${stage.textColor} rounded-full text-xs font-bold`}>
                      {stageLeads.length}
                    </div>
                  </div>
                </div>

                {/* Lead Cards */}
                <div className="space-y-3 min-h-[400px]">
                  {stageLeads.map((lead, index) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      className="bg-white border border-gray-200 rounded-lg p-4 cursor-move hover:shadow-md transition-all duration-200 transform hover:scale-105"
                    >
                      {/* Lead Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm leading-tight">
                            {lead.contact?.full_name || 'Nome não informado'}
                          </h4>
                          {lead.contact?.relation && (
                            <p className="text-xs text-gray-600">
                              {lead.contact.relation}
                            </p>
                          )}
                        </div>
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                          {(lead.contact?.full_name || 'NN').split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                      </div>

                      {/* Lead Info */}
                      <div className="space-y-2 text-xs text-gray-600">
                        <div className="flex items-center">
                          <Phone size={12} className="mr-2" />
                          <span className="font-mono">
                            {formatPhone(lead.contact?.phone || '')}
                          </span>
                        </div>
                        
                        {lead.contact?.unit && (
                          <div className="flex items-center">
                            <MapPin size={12} className="mr-2" />
                            <span>{lead.contact.unit.name}</span>
                          </div>
                        )}
                        
                        {lead.elderly_name && (
                          <div className="flex items-center">
                            <User size={12} className="mr-2" />
                            <span>
                              {lead.elderly_name}
                              {lead.elderly_age && ` (${lead.elderly_age} anos)`}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <Calendar size={12} className="mr-2" />
                          <span>{formatDate(lead.created_at)}</span>
                        </div>
                      </div>

                      {/* Lead Footer */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            {lead.owner?.name || 'Não atribuído'}
                          </div>
                          {lead.dependency_grade && (
                            <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                              Grau {lead.dependency_grade}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Empty State */}
                  {stageLeads.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-4xl mb-2">📋</div>
                      <p className="text-sm">Nenhum lead neste estágio</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Como usar o Pipeline</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Arraste os cards de lead entre as colunas para atualizar o estágio</p>
          <p>• Cada movimento é salvo automaticamente no sistema</p>
          <p>• Use os filtros para focar em unidades ou responsáveis específicos</p>
          <p>• O contador em cada coluna mostra quantos leads estão naquele estágio</p>
        </div>
      </div>
    </div>
  );
};