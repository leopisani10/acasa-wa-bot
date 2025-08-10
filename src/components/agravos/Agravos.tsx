import React, { useState } from 'react';
import { AlertTriangle, Calendar, BarChart3, FileText, Filter, TrendingUp } from 'lucide-react';
import { AgravosProvider, useAgravos } from '../../contexts/AgravosContext';
import { DailyRegistry } from './DailyRegistry';
import { MonthlyIndicators } from './MonthlyIndicators';
import { AnnualSummary } from './AnnualSummary';
import { AgravosAlerts } from './AgravosAlerts';

const AgravosContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'annual' | 'alerts'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUnit, setSelectedUnit] = useState<'Botafogo' | 'Tijuca'>('Botafogo');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const tabs = [
    { key: 'daily', label: 'Registro Diário', icon: Calendar, color: 'text-red-600' },
    { key: 'monthly', label: 'Indicadores Mensais', icon: BarChart3, color: 'text-blue-600' },
    { key: 'annual', label: 'Resumo Anual', icon: FileText, color: 'text-green-600' },
    { key: 'alerts', label: 'Alertas', icon: AlertTriangle, color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-full">
            <AlertTriangle className="text-white" size={32} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 font-sans">
          Controle de Agravos
        </h1>
        <p className="text-gray-600 font-sans">Registro e controle de eventos adversos dos residentes</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">Unidade</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value as 'Botafogo' | 'Tijuca')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-sans"
            >
              <option value="Botafogo">Botafogo</option>
              <option value="Tijuca">Tijuca</option>
            </select>
          </div>

          {activeTab === 'daily' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">Data</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-sans"
              />
            </div>
          )}

          {(activeTab === 'monthly' || activeTab === 'annual') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">Mês</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-sans"
                >
                  {monthNames.map((month, index) => (
                    <option key={index + 1} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">Ano</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-sans"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all font-sans ${
                  activeTab === tab.key
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} className={`mr-2 ${activeTab === tab.key ? 'text-red-600' : 'text-gray-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'daily' && (
          <DailyRegistry selectedDate={selectedDate} selectedUnit={selectedUnit} />
        )}
        
        {activeTab === 'monthly' && (
          <MonthlyIndicators month={selectedMonth} year={selectedYear} unit={selectedUnit} />
        )}
        
        {activeTab === 'annual' && (
          <AnnualSummary year={selectedYear} unit={selectedUnit} />
        )}
        
        {activeTab === 'alerts' && (
          <AgravosAlerts />
        )}
      </div>
    </div>
  );
};

export const Agravos: React.FC = () => {
  return (
    <AgravosProvider>
      <AgravosContent />
    </AgravosProvider>
  );
};