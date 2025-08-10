import React from 'react';
import { MessageCircle, Smartphone, Zap, Users, BarChart3, Clock } from 'lucide-react';

export const CRMInbox: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-full">
            <MessageCircle className="text-white" size={32} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CRM Inbox</h1>
        <p className="text-gray-600">Central de conversas e comunicação com leads</p>
      </div>

      {/* WhatsApp Integration Placeholder */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
            <div className="flex items-center justify-center">
              <Smartphone className="text-white mr-3" size={28} />
              <h2 className="text-2xl font-bold text-white">Integração WhatsApp - Em Breve</h2>
            </div>
          </div>
          
          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <Zap className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                WhatsApp Business API
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Na Etapa 2, implementaremos a integração completa com WhatsApp Business para 
                comunicação direta com leads através desta interface.
              </p>
            </div>

            {/* Mock Interface */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Preview da Interface (Etapa 2):
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Conversations List */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900">Conversas</h5>
                    <div className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                      0
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                      <div className="font-medium text-gray-500 text-sm">Maria Silva</div>
                      <div className="text-xs text-gray-400">Última mensagem...</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                      <div className="font-medium text-gray-500 text-sm">João Santos</div>
                      <div className="text-xs text-gray-400">Interesse em visita...</div>
                    </div>
                  </div>
                </div>

                {/* Chat Interface */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900">Chat</h5>
                    <div className="flex items-center text-xs text-gray-500">
                      <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                      Offline
                    </div>
                  </div>
                  <div className="space-y-2 mb-4 h-40 overflow-y-auto">
                    <div className="bg-gray-100 p-2 rounded-lg text-sm text-gray-600">
                      Bom dia! Gostaria de saber mais sobre a ACASA...
                    </div>
                    <div className="bg-blue-100 p-2 rounded-lg text-sm text-blue-700 ml-8">
                      Olá! Claro, temos vagas disponíveis. Qual o grau de dependência?
                    </div>
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Digite sua mensagem..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50"
                      disabled
                    />
                    <button
                      disabled
                      className="px-4 py-2 bg-gray-300 text-gray-500 rounded-r-lg cursor-not-allowed"
                    >
                      Enviar
                    </button>
                  </div>
                </div>

                {/* Lead Info */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h5 className="font-medium text-gray-900 mb-3">Info do Lead</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nome:</span>
                      <span className="text-gray-500">Maria Silva</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estágio:</span>
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
                        Qualificando
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Idoso:</span>
                      <span className="text-gray-500">José Silva</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Idade:</span>
                      <span className="text-gray-500">78 anos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-400">0</div>
                <div className="text-sm text-gray-600">Conversas Ativas</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-400">0</div>
                <div className="text-sm text-gray-600">Mensagens Hoje</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-400">0</div>
                <div className="text-sm text-gray-600">Tempo Resp. Médio</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-400">0%</div>
                <div className="text-sm text-gray-600">Taxa Conversão</div>
              </div>
            </div>

            {/* Connect Button Placeholder */}
            <div className="text-center">
              <button
                disabled
                className="inline-flex items-center px-8 py-4 bg-gray-300 text-gray-500 rounded-xl cursor-not-allowed text-lg font-medium"
              >
                <Smartphone className="mr-3" size={24} />
                Conectar WhatsApp Business
              </button>
              <p className="text-sm text-gray-500 mt-3">
                Disponível na Etapa 2 - Integração será implementada via Render/Railway
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Preview */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Funcionalidades da Etapa 2:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <MessageCircle className="text-green-600" size={16} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Conversas em Tempo Real</h4>
                  <p className="text-sm text-gray-600">Chat integrado com WhatsApp Business API</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users className="text-blue-600" size={16} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Atribuição Automática</h4>
                  <p className="text-sm text-gray-600">Leads automaticamente atribuídos por unidade</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <BarChart3 className="text-purple-600" size={16} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Analytics Avançados</h4>
                  <p className="text-sm text-gray-600">Métricas de conversação e engajamento</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Clock className="text-orange-600" size={16} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Automações</h4>
                  <p className="text-sm text-gray-600">Respostas automáticas e follow-ups</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};