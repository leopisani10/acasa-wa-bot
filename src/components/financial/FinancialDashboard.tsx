import React, { useState, useEffect } from 'react';
import { DollarSign, Users, TrendingUp, TrendingDown, Calendar, AlertCircle, History, Edit, CheckCircle } from 'lucide-react';
import { useFinancial } from '../../contexts/FinancialContext';
import { useGuests } from '../../contexts/GuestContext';
import { GuestFinancialForm } from './GuestFinancialForm';
import { AdjustmentHistory } from './AdjustmentHistory';
import { RevenueChart } from './RevenueChart';
import { MonthlyPaymentTracker } from './MonthlyPaymentTracker';
import { Guest } from '../../types';

export const FinancialDashboard: React.FC = () => {
  const { financialRecords, getMonthlyRevenue, getAnnualRevenue, getTotalMonthlyRevenue, getAdjustmentHistory, inactivateGuestFinancial } = useFinancial();
  const { guests } = useGuests();
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentTrackingGuest, setPaymentTrackingGuest] = useState<Guest | null>(null);
  const [selectedYear, setSelectedYear] = useState(2026);

  const monthlyRevenue = getMonthlyRevenue(selectedYear);
  const annualRevenue = getAnnualRevenue();
  const totalMonthlyRevenue = getTotalMonthlyRevenue();

  useEffect(() => {
    guests.forEach(guest => {
      if (guest.status === 'Inativo') {
        const record = financialRecords.find(r => r.guestId === guest.id);
        if (record && record.isActive) {
          inactivateGuestFinancial(guest.id);
        }
      }
    });
  }, [guests]);

  const activeRecords = financialRecords.filter(r => r.isActive);
  const inactiveRecords = financialRecords.filter(r => !r.isActive);

  const currentMonth = new Date().toISOString().substring(0, 7);
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().substring(0, 7);

  const currentMonthData = monthlyRevenue.find(m => m.month === currentMonth);
  const lastMonthData = monthlyRevenue.find(m => m.month === lastMonth);

  const monthOverMonthChange = lastMonthData && currentMonthData
    ? ((currentMonthData.revenue - lastMonthData.revenue) / lastMonthData.revenue) * 100
    : 0;

  const totalRevenueLoss = inactiveRecords.reduce((sum, r) => sum + r.revenueLoss, 0);

  const guestsWithFinancial = guests.filter(g =>
    financialRecords.some(r => r.guestId === g.id) &&
    (g.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     g.roomNumber.includes(searchTerm))
  );

  const guestsWithoutFinancial = guests.filter(g =>
    g.status === 'Ativo' &&
    !financialRecords.some(r => r.guestId === g.id) &&
    (g.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     g.roomNumber.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Módulo Financeiro</h1>
        <p className="text-gray-600 mt-2">Gestão financeira dos hóspedes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="text-green-600" size={24} />
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <p className="text-sm text-gray-500">Receita Mensal</p>
          <p className="text-2xl font-bold text-gray-900">
            R$ {totalMonthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="text-blue-600" size={24} />
            <TrendingUp className="text-blue-600" size={20} />
          </div>
          <p className="text-sm text-gray-500">Receita Anual Projetada</p>
          <p className="text-2xl font-bold text-gray-900">
            R$ {annualRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-acasa-purple" size={24} />
            {monthOverMonthChange >= 0 ? (
              <TrendingUp className="text-green-600" size={20} />
            ) : (
              <TrendingDown className="text-red-600" size={20} />
            )}
          </div>
          <p className="text-sm text-gray-500">Variação Mensal</p>
          <p className={`text-2xl font-bold ${monthOverMonthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {monthOverMonthChange >= 0 ? '+' : ''}{monthOverMonthChange.toFixed(1)}%
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="text-red-600" size={24} />
            <TrendingDown className="text-red-600" size={20} />
          </div>
          <p className="text-sm text-gray-500">Perda de Receita</p>
          <p className="text-2xl font-bold text-red-600">
            R$ {totalRevenueLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {inactiveRecords.length} hóspede{inactiveRecords.length !== 1 ? 's' : ''} inativo{inactiveRecords.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {currentMonthData && lastMonthData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Análise do Mês</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Mês Anterior</p>
              <p className="text-xl font-bold text-gray-900">
                R$ {lastMonthData.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {lastMonthData.activeGuests} hóspedes ativos
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Mês Atual</p>
              <p className="text-xl font-bold text-acasa-purple">
                R$ {currentMonthData.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {currentMonthData.activeGuests} hóspedes ativos
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Variação</p>
              <div className="flex items-center space-x-2">
                {monthOverMonthChange >= 0 ? (
                  <TrendingUp className="text-green-600" size={24} />
                ) : (
                  <TrendingDown className="text-red-600" size={24} />
                )}
                <p className={`text-xl font-bold ${monthOverMonthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monthOverMonthChange >= 0 ? '+' : ''}{monthOverMonthChange.toFixed(1)}%
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {monthOverMonthChange >= 0 ? 'Aumento' : 'Redução'} de R$ {Math.abs(currentMonthData.revenue - lastMonthData.revenue).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Gráfico de Receita</h2>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <RevenueChart data={monthlyRevenue} year={selectedYear} />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-700">Hóspedes Ativos</span>
              <span className="text-lg font-bold text-green-600">{activeRecords.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm text-gray-700">Hóspedes Inativos</span>
              <span className="text-lg font-bold text-red-600">{inactiveRecords.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-700">Média por Hóspede</span>
              <span className="text-lg font-bold text-blue-600">
                R$ {activeRecords.length > 0 ? (totalMonthlyRevenue / activeRecords.length).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm text-gray-700">Sem Dados Financeiros</span>
              <span className="text-lg font-bold text-acasa-purple">
                {guests.filter(g => g.status === 'Ativo' && !financialRecords.some(r => r.guestId === g.id)).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hóspedes</h2>
          <input
            type="text"
            placeholder="Buscar por nome ou quarto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acasa-purple focus:border-transparent"
          />
        </div>

        <div className="p-6">
          {guestsWithoutFinancial.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <AlertCircle className="mr-2 text-orange-600" size={20} />
                Sem Dados Financeiros ({guestsWithoutFinancial.length})
              </h3>
              <div className="space-y-2">
                {guestsWithoutFinancial.map(guest => (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{guest.fullName}</p>
                      <p className="text-sm text-gray-600">Quarto {guest.roomNumber} - {guest.status}</p>
                    </div>
                    <button
                      onClick={() => setSelectedGuest(guest)}
                      className="px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-acasa-red text-sm"
                    >
                      Adicionar Dados
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h3 className="text-md font-medium text-gray-900 mb-3">
            Com Dados Financeiros ({guestsWithFinancial.length})
          </h3>
          <div className="space-y-2">
            {guestsWithFinancial.map(guest => {
              const record = financialRecords.find(r => r.guestId === guest.id);
              const adjustments = getAdjustmentHistory(guest.id);
              const totalMonthly = record
                ? record.monthlyFee + record.climatizationFee + record.maintenanceFee + record.trousseauFee
                : 0;

              return (
                <div
                  key={guest.id}
                  className={`border rounded-lg p-4 ${record?.isActive ? 'border-gray-200 bg-white' : 'border-red-200 bg-red-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-gray-900">{guest.fullName}</p>
                        {!record?.isActive && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                            Inativo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">Quarto {guest.roomNumber}</p>
                      {record && (
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Mensalidade:</span>
                            <span className="ml-1 font-semibold text-gray-900">R$ {record.monthlyFee.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Climatização:</span>
                            <span className="ml-1 font-semibold text-gray-900">R$ {record.climatizationFee.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Manutenção:</span>
                            <span className="ml-1 font-semibold text-gray-900">R$ {record.maintenanceFee.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Total:</span>
                            <span className="ml-1 font-bold text-acasa-purple">R$ {totalMonthly.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      {adjustments.length > 0 && (
                        <button
                          onClick={() => setShowHistory(showHistory === guest.id ? null : guest.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Ver histórico"
                        >
                          <History size={20} />
                        </button>
                      )}
                      {record?.isActive && (
                        <button
                          onClick={() => setPaymentTrackingGuest(guest)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Controlar Pagamentos"
                        >
                          <CheckCircle size={20} />
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedGuest(guest)}
                        className="p-2 text-acasa-purple hover:bg-purple-50 rounded-lg"
                        title="Editar"
                      >
                        <Edit size={20} />
                      </button>
                    </div>
                  </div>

                  {showHistory === guest.id && adjustments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <AdjustmentHistory adjustments={adjustments} guestName={guest.fullName} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedGuest && (
        <GuestFinancialForm
          guest={selectedGuest}
          record={financialRecords.find(r => r.guestId === selectedGuest.id)}
          onClose={() => setSelectedGuest(null)}
          onSave={() => setSelectedGuest(null)}
        />
      )}

      {paymentTrackingGuest && (
        <MonthlyPaymentTracker
          guest={paymentTrackingGuest}
          onClose={() => setPaymentTrackingGuest(null)}
        />
      )}
    </div>
  );
};
