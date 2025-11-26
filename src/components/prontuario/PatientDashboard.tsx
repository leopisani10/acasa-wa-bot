import React, { useState } from 'react';
import { ArrowLeft, User, Calendar, MapPin, Activity, FileText, Plus, Clock, Stethoscope, Heart, Apple, Brain, Mic, Users as UsersIcon, Zap } from 'lucide-react';
import { Guest } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useProntuario } from '../../contexts/ProntuarioContext';
import { mapPositionToSpecialty, hasPermission, SPECIALTY_CONFIG } from '../../types/prontuario';
import { SpecialtyRecords } from './SpecialtyRecords';

interface PatientDashboardProps {
  guest: Guest;
  onBack: () => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ guest, onBack }) => {
  const { user } = useAuth();
  const [activeSpecialty, setActiveSpecialty] = useState<string | null>(null);

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getSpecialtyIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      'Stethoscope': Stethoscope,
      'Heart': Heart,
      'Activity': Activity,
      'Zap': Zap,
      'Mic': Mic,
      'Brain': Brain,
      'Apple': Apple,
      'Users': UsersIcon,
    };
    return icons[iconName] || FileText;
  };

  const userSpecialty = mapPositionToSpecialty(user?.position || '');
  const canWriteAny = Object.keys(SPECIALTY_CONFIG).some(specialty => 
    hasPermission(user?.position || '', 'write', specialty)
  );

  // Se usuário selecionou uma especialidade, mostrar os registros
  if (activeSpecialty) {
    return (
      <SpecialtyRecords
        guest={guest}
        specialty={activeSpecialty}
        onBack={() => setActiveSpecialty(null)}
        onBackToPatientList={onBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              <ArrowLeft size={20} className="mr-2" />
              Voltar à Lista de Pacientes
            </button>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{user?.name}</span> • {user?.position}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Patient Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mr-6">
                {guest.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{guest.fullName}</h1>
                <div className="flex items-center space-x-6 text-gray-600">
                  <div className="flex items-center">
                    <Calendar size={18} className="mr-2 text-blue-500" />
                    <span className="font-medium">{calculateAge(guest.birthDate)} anos • {guest.gender}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin size={18} className="mr-2 text-blue-500" />
                    <span className="font-medium">Quarto {guest.roomNumber} • {guest.unit}</span>
                  </div>
                  <div className="flex items-center">
                    <Activity size={18} className="mr-2 text-blue-500" />
                    <span className="font-medium">Dependência Grau {guest.dependencyLevel}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium border border-green-200">
                ✓ {guest.status}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                CPF: {guest.cpf}
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="font-semibold text-blue-700">Plano de Saúde</div>
              <div className="text-sm text-gray-700 mt-1">{guest.healthPlan || 'Não informado'}</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <div className="font-semibold text-purple-700">Fonoaudiologia</div>
              <div className="text-sm text-gray-700 mt-1">{guest.hasSpeechTherapy ? 'Sim' : 'Não'}</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <div className="font-semibold text-orange-700">Vacinação</div>
              <div className="text-sm text-gray-700 mt-1">{guest.vaccinationUpToDate ? 'Em dia' : 'Pendente'}</div>
            </div>
          </div>
        </div>

        {/* Multidisciplinary Sections */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Evoluções Multidisciplinares</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(SPECIALTY_CONFIG).map(([specialtyKey, config]) => {
              const Icon = getSpecialtyIcon(config.icon);
              const canRead = hasPermission(user?.position || '', 'read', specialtyKey);
              const canWrite = hasPermission(user?.position || '', 'write', specialtyKey);
              const isUserSpecialty = userSpecialty === specialtyKey;

              if (!canRead) return null;

              return (
                <div
                  key={specialtyKey}
                  className={`${config.bgColor} ${config.borderColor} border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${isUserSpecialty ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                  onClick={() => setActiveSpecialty(specialtyKey)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 ${config.buttonColor.split(' ')[0]} rounded-lg`}>
                      <Icon className="text-white" size={24} />
                    </div>
                    {isUserSpecialty && (
                      <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                        Sua Área
                      </div>
                    )}
                  </div>
                  
                  <h3 className={`text-lg font-bold ${config.textColor} mb-2`}>
                    {config.name}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Evoluções:</span>
                      <span className="font-medium">0</span> {/* TODO: Get real count */}
                    </div>
                    <div className="flex justify-between">
                      <span>Última:</span>
                      <span className="font-medium">-</span> {/* TODO: Get last date */}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${config.textColor}`}>
                        {canWrite ? '✏️ Pode evoluir' : '👁️ Apenas leitura'}
                      </span>
                      <div className="flex items-center text-xs text-gray-500">
                        <FileText size={12} className="mr-1" />
                        Abrir
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        {canWriteAny && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Evoluções Rápidas</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(SPECIALTY_CONFIG).map(([specialtyKey, config]) => {
                const Icon = getSpecialtyIcon(config.icon);
                const canWrite = hasPermission(user?.position || '', 'write', specialtyKey);
                
                if (!canWrite) return null;

                return (
                  <button
                    key={specialtyKey}
                    onClick={() => setActiveSpecialty(specialtyKey)}
                    className={`flex items-center px-4 py-2 ${config.buttonColor} text-white rounded-lg transition-colors font-medium`}
                  >
                    <Plus size={16} className="mr-2" />
                    Nova Anotação - {config.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Access Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="bg-blue-500 p-2 rounded-lg mr-3">
              <FileText className="text-white" size={16} />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Sistema Multidisciplinar</h4>
              <p className="text-sm text-blue-700">
                Como <strong>{user?.position}</strong>, você pode fazer evoluções em <strong>{userSpecialty}</strong> e 
                consultar todas as outras especialidades em modo somente leitura.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};