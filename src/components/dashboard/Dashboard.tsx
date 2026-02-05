import React, { useState } from 'react';
import { Users, UserCheck, UserX, Calendar, TrendingUp, AlertTriangle, FileText, FileCheck, Receipt, Clock, Building2, User, Award, Timer, XCircle } from 'lucide-react';
import { useGuests } from '../../contexts/GuestContext';
import { useEmployees } from '../../contexts/EmployeeContext';
import { useDocuments } from '../../contexts/DocumentContext';
import { useCertificates } from '../../contexts/CertificateContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRooms } from '../../contexts/RoomContext';

export const Dashboard: React.FC = () => {
  const { guests } = useGuests();
  const { employees, getExpiringItems } = useEmployees();
  const { documents } = useDocuments();
  const { certificates, getExpiringCertificates } = useCertificates();
  const { user } = useAuth();
  const { rooms } = useRooms();
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  const activeGuests = guests.filter(g => g.status === 'Ativo');
  const reservedGuests = guests.filter(g => g.status === 'Reservado');
  const inactiveGuests = guests.filter(g => g.status === 'Inativo');

  // Filtros por tipo de permanência
  const longStayGuests = guests.filter(g => g.stayType === 'Longa Permanência');
  const dayCenterGuests = guests.filter(g => g.stayType === 'Centro Dia');
  const activeLongStayGuests = activeGuests.filter(g => g.stayType === 'Longa Permanência');
  const activeDayCenterGuests = activeGuests.filter(g => g.stayType === 'Centro Dia');

  // Calcular idades dos hóspedes
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const ages = guests.map(guest => calculateAge(guest.birthDate));
  const averageAge = ages.length > 0 ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 0;
  const maxAge = ages.length > 0 ? Math.max(...ages) : 0;
  const minAge = ages.length > 0 ? Math.min(...ages) : 0;

  // Calcular tempo de permanência (LTV)
  const calculateStayDuration = (admissionDate: string, exitDate?: string) => {
    const admission = new Date(admissionDate);
    const end = exitDate ? new Date(exitDate) : new Date();

    const diffTime = Math.abs(end.getTime() - admission.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);

    return {
      days: diffDays,
      months: diffMonths,
      years: diffYears,
      formattedYears: diffYears,
      formattedMonths: diffMonths % 12,
      formattedDays: diffDays % 30
    };
  };

  // Calcular métricas de permanência
  const stayDurations = guests.map(guest =>
    calculateStayDuration(guest.admissionDate, guest.exitDate)
  );

  const totalDays = stayDurations.reduce((sum, duration) => sum + duration.days, 0);
  const averageStayDays = guests.length > 0 ? Math.round(totalDays / guests.length) : 0;
  const averageStayMonths = Math.floor(averageStayDays / 30);
  const averageStayYears = Math.floor(averageStayMonths / 12);

  // Hóspede com contrato mais antigo (ativo)
  const oldestActiveGuest = activeGuests.length > 0
    ? activeGuests.reduce((oldest, guest) => {
        return new Date(guest.admissionDate) < new Date(oldest.admissionDate) ? guest : oldest;
      })
    : null;

  const oldestStayDuration = oldestActiveGuest
    ? calculateStayDuration(oldestActiveGuest.admissionDate)
    : null;

  // Hóspede com contrato mais novo (ativo)
  const newestActiveGuest = activeGuests.length > 0
    ? activeGuests.reduce((newest, guest) => {
        return new Date(guest.admissionDate) > new Date(newest.admissionDate) ? guest : newest;
      })
    : null;

  const newestStayDuration = newestActiveGuest
    ? calculateStayDuration(newestActiveGuest.admissionDate)
    : null;

  // Taxa de renovação (hóspedes com novo contrato)
  const guestsWithRenewal = guests.filter(g => g.hasNewContract).length;
  const renewalRate = guests.length > 0
    ? Math.round((guestsWithRenewal / guests.length) * 100)
    : 0;

  // Média de ocupação por quarto
  const roomsOccupied = new Set(activeGuests.map(g => g.roomNumber)).size;

  // Hóspedes por nível de dependência
  const dependencyLevels = activeGuests.reduce((acc, guest) => {
    acc[guest.dependencyLevel] = (acc[guest.dependencyLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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

  // Calcular contratos vencendo nos próximos 30 dias e vencidos
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const expiringContracts = activeGuests.filter(guest => {
    if (!guest.contractExpiryDate) return false;
    const expiryDate = new Date(guest.contractExpiryDate);
    expiryDate.setHours(0, 0, 0, 0);
    return expiryDate > today && expiryDate <= thirtyDaysFromNow;
  });

  const expiredContracts = activeGuests.filter(guest => {
    if (!guest.contractExpiryDate) return false;
    const expiryDate = new Date(guest.contractExpiryDate);
    expiryDate.setHours(0, 0, 0, 0);
    return expiryDate <= today;
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
      title: 'Reservas (Aguardando Entrada)',
      value: reservedGuests.length,
      icon: Calendar,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Contratos Vencendo (30 dias)',
      value: expiringContracts.length,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      title: 'Contratos Vencidos',
      value: expiredContracts.length,
      icon: XCircle,
      color: 'bg-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ];

  // Calcular capacidade total e ocupação baseado apenas nas camas ATIVAS dos quartos
  const totalActiveBeds = rooms.reduce((sum, room) => {
    return sum + room.beds.filter(bed => bed.status === 'Ativa').length;
  }, 0);
  const occupiedBeds = rooms.reduce((sum, room) => {
    return sum + room.beds.filter(bed => bed.status === 'Ativa' && bed.guestId !== null).length;
  }, 0);
  const availableBeds = totalActiveBeds - occupiedBeds;
  const totalOccupancyRate = totalActiveBeds > 0 ? Math.round((occupiedBeds / totalActiveBeds) * 100) : 0;

  const stayTypeStats = [
    {
      title: 'Longa Permanência',
      value: activeLongStayGuests.length,
      total: longStayGuests.length,
      icon: Building2,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Centro Dia',
      value: activeDayCenterGuests.length,
      total: dayCenterGuests.length,
      icon: Clock,
      color: 'bg-teal-500',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-600',
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
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

      {/* Stay Type Stats */}
      <div className="space-y-4">
        {/* Ocupação Total */}
        <div className="bg-white rounded-lg border-2 border-acasa-purple p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Ocupação Total da Instituição</p>
              <p className="text-4xl font-bold text-gray-900">
                {occupiedBeds} <span className="text-2xl text-gray-400">/ {totalActiveBeds}</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {availableBeds} cama{availableBeds !== 1 ? 's disponíveis' : ' disponível'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Baseado nas camas ativas dos quartos
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-acasa-purple">
                {totalOccupancyRate}%
              </div>
              <p className="text-sm text-gray-500 mt-1">Taxa de Ocupação</p>
            </div>
          </div>
        </div>

        {/* Breakdown por Tipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stayTypeStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-5 hover:border-acasa-purple transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <Icon className="text-white" size={28} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stat.total - stat.value} inativo{stat.total - stat.value !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Contratos de Hóspedes Vencidos */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <XCircle className="mr-2 text-red-600" size={20} />
            Contratos Vencidos
          </h2>
          {expiredContracts.length > 0 ? (
            <>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {expiredContracts.slice(0, 3).map((guest) => (
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
              </div>
              {expiredContracts.length > 3 && (
                <button
                  onClick={() => setShowExpiredModal(true)}
                  className="w-full mt-3 text-sm text-acasa-purple hover:text-acasa-red font-medium transition-colors"
                >
                  Ver mais ({expiredContracts.length - 3} adicional{expiredContracts.length - 3 !== 1 ? 'is' : ''})
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <XCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Nenhum contrato vencido</p>
            </div>
          )}
        </div>

        {/* Contratos de Hóspedes Vencendo */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="mr-2 text-orange-600" size={20} />
            Contratos Vencendo (30 dias)
          </h2>
          {expiringContracts.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {expiringContracts.slice(0, 3).map((guest) => (
                <div key={guest.id} className="flex items-center justify-between p-3 bg-orange-50 rounded border-l-3 border-orange-600">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{guest.fullName}</p>
                    <p className="text-xs text-gray-600">Quarto {guest.roomNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-orange-600">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-3 bg-blue-50 rounded border border-blue-100">
            <p className="text-2xl font-bold text-blue-600 font-sans">{guests.filter(g => g.healthPlan).length}</p>
            <p className="text-sm text-gray-600 font-sans">Com Plano de Saúde</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded border border-gray-100">
            <p className="text-2xl font-bold text-acasa-purple font-sans">
              {guests.filter(g => g.vaccinationUpToDate).length}
            </p>
            <p className="text-sm text-gray-600 font-sans">Vacinação em Dia</p>
          </div>
        </div>
      </div>

      {/* Age Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <User className="mr-2 text-acasa-purple" size={24} />
          Estatísticas de Idade dos Hóspedes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-3xl font-bold text-blue-600 font-sans">{averageAge}</p>
            <p className="text-sm text-gray-600 font-sans mt-2">Idade Média</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
            <p className="text-3xl font-bold text-green-600 font-sans">{maxAge}</p>
            <p className="text-sm text-gray-600 font-sans mt-2">Maior Idade</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
            <p className="text-3xl font-bold text-orange-600 font-sans">{minAge}</p>
            <p className="text-sm text-gray-600 font-sans mt-2">Menor Idade</p>
          </div>
        </div>
      </div>

      {/* LTV - Lifetime Value & Stay Duration */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Timer className="mr-2 text-acasa-purple" size={24} />
          Tempo de Permanência (LTV - Lifetime Value)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-acasa-purple/10 rounded-lg border border-acasa-purple/20">
            <p className="text-3xl font-bold text-acasa-purple font-sans">
              {averageStayYears > 0 ? `${averageStayYears}a ${averageStayMonths % 12}m` : `${averageStayMonths}m`}
            </p>
            <p className="text-sm text-gray-600 font-sans mt-2">Permanência Média</p>
            <p className="text-xs text-gray-500 font-sans mt-1">{averageStayDays} dias</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
            <p className="text-2xl font-bold text-green-600 font-sans">{renewalRate}%</p>
            <p className="text-sm text-gray-600 font-sans mt-2">Taxa de Renovação</p>
            <p className="text-xs text-gray-500 font-sans mt-1">{guestsWithRenewal} hóspedes</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-3xl font-bold text-blue-600 font-sans">{roomsOccupied}</p>
            <p className="text-sm text-gray-600 font-sans mt-2">Quartos Ocupados</p>
            <p className="text-xs text-gray-500 font-sans mt-1">De {activeGuests.length} hóspedes</p>
          </div>
        </div>

        {/* Oldest and Newest Guests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {oldestActiveGuest && oldestStayDuration && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center mb-2">
                <Award className="text-amber-600 mr-2" size={20} />
                <h3 className="text-sm font-semibold text-gray-900">Hóspede Mais Antigo</h3>
              </div>
              <p className="text-lg font-bold text-gray-900">{oldestActiveGuest.fullName}</p>
              <p className="text-sm text-gray-600 mt-1">Quarto {oldestActiveGuest.roomNumber}</p>
              <div className="mt-2 pt-2 border-t border-amber-200">
                <p className="text-xl font-bold text-amber-700">
                  {oldestStayDuration.formattedYears > 0
                    ? `${oldestStayDuration.formattedYears} ano${oldestStayDuration.formattedYears > 1 ? 's' : ''} e ${oldestStayDuration.formattedMonths} mês${oldestStayDuration.formattedMonths !== 1 ? 'es' : ''}`
                    : `${oldestStayDuration.formattedMonths} mês${oldestStayDuration.formattedMonths !== 1 ? 'es' : ''}`}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Desde {new Date(oldestActiveGuest.admissionDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          )}

          {newestActiveGuest && newestStayDuration && (
            <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
              <div className="flex items-center mb-2">
                <Calendar className="text-teal-600 mr-2" size={20} />
                <h3 className="text-sm font-semibold text-gray-900">Hóspede Mais Recente</h3>
              </div>
              <p className="text-lg font-bold text-gray-900">{newestActiveGuest.fullName}</p>
              <p className="text-sm text-gray-600 mt-1">Quarto {newestActiveGuest.roomNumber}</p>
              <div className="mt-2 pt-2 border-t border-teal-200">
                <p className="text-xl font-bold text-teal-700">
                  {newestStayDuration.formattedYears > 0
                    ? `${newestStayDuration.formattedYears} ano${newestStayDuration.formattedYears > 1 ? 's' : ''} e ${newestStayDuration.formattedMonths} mês${newestStayDuration.formattedMonths !== 1 ? 'es' : ''}`
                    : newestStayDuration.formattedMonths > 0
                    ? `${newestStayDuration.formattedMonths} mês${newestStayDuration.formattedMonths !== 1 ? 'es' : ''}`
                    : `${newestStayDuration.formattedDays} dia${newestStayDuration.formattedDays !== 1 ? 's' : ''}`}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Desde {new Date(newestActiveGuest.admissionDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dependency Levels Distribution */}
      {Object.keys(dependencyLevels).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="mr-2 text-acasa-purple" size={24} />
            Distribuição por Nível de Dependência
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(dependencyLevels).map(([level, count]) => (
              <div key={level} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-2xl font-bold text-acasa-purple font-sans">{count}</p>
                <p className="text-sm text-gray-600 font-sans mt-1">{level}</p>
                <p className="text-xs text-gray-500 font-sans mt-1">
                  {Math.round((count / activeGuests.length) * 100)}% do total
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Contratos Vencidos */}
      {showExpiredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <XCircle className="mr-2 text-red-600" size={24} />
                Contratos Vencidos ({expiredContracts.length})
              </h2>
              <button
                onClick={() => setShowExpiredModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              <div className="space-y-3">
                {expiredContracts.map((guest) => (
                  <div key={guest.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{guest.fullName}</p>
                      <p className="text-sm text-gray-600">Quarto {guest.roomNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">
                        Vencido em
                      </p>
                      <p className="text-sm font-semibold text-red-700">
                        {formatDate(guest.contractExpiryDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowExpiredModal(false)}
                className="w-full px-4 py-2 bg-acasa-purple text-white rounded-lg hover:bg-acasa-red transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};