import React from 'react';
import { Users, UserCheck, UserX, Calendar, TrendingUp, AlertTriangle, FileText, FileCheck, Receipt, Clock, Building2 } from 'lucide-react';
import { useGuests } from '../../contexts/GuestContext';
import { useEmployees } from '../../contexts/EmployeeContext';
import { useDocuments } from '../../contexts/DocumentContext';
import { useCertificates } from '../../contexts/CertificateContext';
import { useAuth } from '../../contexts/AuthContext';

export const Dashboard: React.FC = () => {
  const { guests } = useGuests();
  const { employees, getExpiringItems } = useEmployees();
  const { documents } = useDocuments();
  const { certificates, getExpiringCertificates } = useCertificates();
  const { user } = useAuth();

  const activeGuests = guests.filter(g => g.status === 'Ativo');
  const inactiveGuests = guests.filter(g => g.status === 'Inativo');
  const guestsWithDiapers = guests.filter(g => g.diaperContracted);
  const guestsWithHealthPlan = guests.filter(g => g.healthPlan);

  // Employee stats
  const activeEmployees = employees.filter(e => e.status === 'Ativo');
  const cltEmployees = employees.filter(e => e.employmentType === 'CLT');
  const expiringEmployeeItems = getExpiringItems();

  // Document stats
  const activeDocuments = documents.filter(d => d.status === 'Ativo');
  const documentsInReview = documents.filter(d => d.status === 'Em Revisão');

  // Certificate stats
  const activeCertificates = certificates.filter(c => c.status === 'Em dia');
  const expiringCertificates = getExpiringCertificates();
  // Calcular contratos vencendo nos próximos 30 dias
  const expiringContracts = guests.filter(guest => {
    const expiryDate = new Date(guest.contractExpiryDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    return expiryDate >= today && expiryDate <= thirtyDaysFromNow && guest.status === 'Ativo';
  });

  const stats = [
    {
      title: 'Total de Hóspedes',
      value: guests.length,
      icon: Users,
      color: 'bg-acasa-purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-acasa-purple',
    },
    {
      title: 'Hóspedes Ativos',
      value: activeGuests.length,
      icon: UserCheck,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Hóspedes Inativos',
      value: inactiveGuests.length,
      icon: UserX,
      color: 'bg-acasa-red',
      bgColor: 'bg-red-50',
      textColor: 'text-acasa-red',
    },
    {
      title: 'Contratos Vencendo',
      value: expiringContracts.length,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bem-vindo, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">Visão geral do sistema ACASA Residencial Sênior.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-5 hover:border-acasa-purple transition-colors">
              <div className="flex items-center">
                <div className={`${stat.color} p-2 rounded`}>
                  <Icon className="text-white" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contratos de Hóspedes Vencendo */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Calendar className="mr-2 text-red-600" size={20} />
            Contratos Vencendo
          </h2>
          {expiringContracts.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {expiringContracts.slice(0, 3).map((guest) => (
                <div key={guest.id} className="flex items-center justify-between p-3 bg-red-50 rounded border-l-3 border-red-600">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{guest.fullName}</p>
                    <p className="text-xs text-gray-600">Quarto {guest.roomNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-red-600">
                      {formatDate(guest.contractExpiryDate)}
                    </p>
                  </div>
                </div>
              ))}
              {expiringContracts.length > 3 && (
                <p className="text-xs text-gray-600 text-center pt-2">
                  +{expiringContracts.length - 3} contratos adicionais
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Nenhum contrato vencendo</p>
            </div>
          )}
        </div>

        {/* Itens de Colaboradores Vencendo */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Clock className="mr-2 text-orange-600" size={20} />
            Colaboradores - Vencimentos
          </h2>
          {expiringEmployeeItems.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {expiringEmployeeItems.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded border-l-3 border-orange-600">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{item.employeeName}</p>
                    <p className="text-xs text-gray-600">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-orange-600">
                      {item.daysUntilExpiry} dias
                    </p>
                  </div>
                </div>
              ))}
              {expiringEmployeeItems.length > 3 && (
                <p className="text-xs text-gray-600 text-center pt-2">
                  +{expiringEmployeeItems.length - 3} itens adicionais
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Clock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Nenhum item vencendo</p>
            </div>
          )}
        </div>

        {/* Certificados Vencendo */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FileCheck className="mr-2 text-yellow-600" size={20} />
            Certificados Vencendo
          </h2>
          {expiringCertificates.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {expiringCertificates.slice(0, 3).map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded border-l-3 border-yellow-600">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{cert.service}</p>
                    <p className="text-xs text-gray-600">{cert.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-yellow-600">
                      {cert.daysUntilExpiry < 0 ? `${Math.abs(cert.daysUntilExpiry)} dias atraso` : `${cert.daysUntilExpiry} dias`}
                    </p>
                  </div>
                </div>
              ))}
              {expiringCertificates.length > 3 && (
                <p className="text-xs text-gray-600 text-center pt-2">
                  +{expiringCertificates.length - 3} certificados adicionais
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <FileCheck className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Nenhum certificado vencendo</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary by Units */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contratos Vencendo */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="mr-2 text-acasa-purple" size={24} />
            Hóspedes por Unidade
          </h2>
          <div className="space-y-4">
            {['Botafogo'].map((unit) => {
              const unitGuests = activeGuests.filter(g => g.unit === unit);
              const unitTotal = guests.filter(g => g.unit === unit);
              return (
                <div key={unit} className="flex items-center justify-between p-3 bg-gray-50 rounded border-l-3 border-acasa-purple">
                  <div>
                    <p className="font-medium text-gray-900">{unit}</p>
                    <p className="text-sm text-gray-600">
                      {unitGuests.length} ativos de {unitTotal.length} total
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-acasa-purple">{unitGuests.length}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Colaboradores por Unidade */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Building2 className="mr-2 text-green-600" size={24} />
            Colaboradores por Unidade
          </h2>
          <div className="space-y-4">
            {['Botafogo'].map((unit) => {
              const unitEmployees = activeEmployees.filter(e => e.unit === unit);
              const unitTotal = employees.filter(e => e.unit === unit);
              return (
                <div key={unit} className="flex items-center justify-between p-3 bg-gray-50 rounded border-l-3 border-green-600">
                  <div>
                    <p className="font-medium text-gray-900">{unit}</p>
                    <p className="text-sm text-gray-600">
                      {unitEmployees.length} ativos de {unitTotal.length} total
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{unitEmployees.length}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Estatísticas Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-3 bg-purple-50 rounded border border-purple-100">
            <p className="text-2xl font-bold text-acasa-purple font-sans">{guestsWithDiapers.length}</p>
            <p className="text-sm text-gray-600 font-sans">Com Fralda Contratada</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded border border-blue-100">
            <p className="text-2xl font-bold text-blue-600 font-sans">{guestsWithHealthPlan.length}</p>
            <p className="text-sm text-gray-600 font-sans">Com Plano de Saúde</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded border border-green-100">
            <p className="text-2xl font-bold text-green-600 font-sans">
              {guests.filter(g => g.hasPhysiotherapy).length}
            </p>
            <p className="text-sm text-gray-600 font-sans">Com Fisioterapia</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded border border-gray-100">
            <p className="text-2xl font-bold text-acasa-purple font-sans">
              {guests.filter(g => g.vaccinationUpToDate).length}
            </p>
            <p className="text-sm text-gray-600 font-sans">Vacinação em Dia</p>
          </div>
        </div>
      </div>
    </div>
  );
};