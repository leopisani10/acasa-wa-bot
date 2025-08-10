import React from 'react';
import { Clipboard, Construction, ArrowRight } from 'lucide-react';

export const KatzAgravos: React.FC = () => {
  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-acasa-purple to-purple-700 p-4 rounded-full">
            <Clipboard className="text-white" size={32} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 font-sans">
          Escala de Katz & Agravos
        </h1>
        <p className="text-gray-600 font-sans">Avaliação funcional e controle de intercorrências</p>
      </div>

      {/* Under Construction Card */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-orange-400 to-orange-600 p-6">
            <div className="flex items-center justify-center">
              <Construction className="text-white mr-3" size={28} />
              <h2 className="text-2xl font-bold text-white font-sans">Em Construção</h2>
            </div>
          </div>
          
          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                <Construction className="text-orange-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 font-sans">
                Módulo em Desenvolvimento
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto font-sans">
                Estamos desenvolvendo dois módulos distintos: a Escala de Katz para avaliação funcional 
                e o sistema de Agravos para controle de intercorrências dos hóspedes.
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 font-sans">
                Módulos em desenvolvimento:
              </h4>
              
              {/* Escala de Katz */}
              <div className="bg-white rounded-lg p-4 mb-4 border border-purple-200">
                <h5 className="text-md font-bold text-acasa-purple mb-3 font-sans">📊 Escala de Katz</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                  <div className="flex items-start space-x-3">
                    <ArrowRight className="text-purple-500 mt-0.5 flex-shrink-0" size={14} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 font-sans">Avaliação Funcional</p>
                      <p className="text-xs text-gray-600 font-sans">6 atividades básicas de vida diária</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <ArrowRight className="text-purple-500 mt-0.5 flex-shrink-0" size={14} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 font-sans">Pontuação Automática</p>
                      <p className="text-xs text-gray-600 font-sans">Cálculo de independência funcional</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <ArrowRight className="text-purple-500 mt-0.5 flex-shrink-0" size={14} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 font-sans">Histórico de Avaliações</p>
                      <p className="text-xs text-gray-600 font-sans">Evolução funcional ao longo do tempo</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <ArrowRight className="text-purple-500 mt-0.5 flex-shrink-0" size={14} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 font-sans">Relatórios de Capacidade</p>
                      <p className="text-xs text-gray-600 font-sans">Análise da autonomia dos hóspedes</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Agravos */}
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <h5 className="text-md font-bold text-red-600 mb-3 font-sans">🚨 Controle de Agravos</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                  <div className="flex items-start space-x-3">
                    <ArrowRight className="text-red-500 mt-0.5 flex-shrink-0" size={14} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 font-sans">Registro de Quedas</p>
                      <p className="text-xs text-gray-600 font-sans">Controle e análise de acidentes</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <ArrowRight className="text-red-500 mt-0.5 flex-shrink-0" size={14} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 font-sans">Intercorrências Clínicas</p>
                      <p className="text-xs text-gray-600 font-sans">Eventos adversos de saúde</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <ArrowRight className="text-red-500 mt-0.5 flex-shrink-0" size={14} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 font-sans">Notificações Automáticas</p>
                      <p className="text-xs text-gray-600 font-sans">Alertas para familiares e equipe</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <ArrowRight className="text-red-500 mt-0.5 flex-shrink-0" size={14} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 font-sans">Estatísticas de Segurança</p>
                      <p className="text-xs text-gray-600 font-sans">Análise de padrões e prevenção</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-acasa-purple to-purple-700 text-white rounded-lg font-sans font-medium">
                <Clipboard className="mr-2" size={20} />
                Dois Módulos em Breve
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-lg mr-4">
              <Clipboard className="text-acasa-purple" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 font-sans">Escala de Katz</h3>
          </div>
          <p className="text-gray-600 text-sm font-sans">
            Instrumento padronizado para avaliar a independência funcional em 6 atividades básicas: 
            banho, vestir-se, uso do banheiro, transferência, continência e alimentação.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="bg-orange-100 p-3 rounded-lg mr-4">
              <AlertTriangle className="text-orange-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 font-sans">Controle de Agravos</h3>
          </div>
          <p className="text-gray-600 text-sm font-sans">
            Sistema para registro e controle de intercorrências como quedas, eventos adversos 
            e outras situações que exijam notificação e acompanhamento.
          </p>
        </div>
      </div>
    </div>
  )
}