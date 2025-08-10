import React, { useState } from 'react';
import { ArrowLeft, Plus, FileText, Calendar, User, Clock, Search, Filter, Download, Stethoscope, Heart, Activity, Mic, Brain, Apple, Users, Zap } from 'lucide-react';
import { Guest } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { SPECIALTY_CONFIG, hasPermission, mapPositionToSpecialty } from '../../types/prontuario';

interface SpecialtyRecordsProps {
  guest: Guest;
  specialty: string;
  onBack: () => void;
  onBackToPatientList: () => void;
}

export const SpecialtyRecords: React.FC<SpecialtyRecordsProps> = ({ 
  guest, 
  specialty, 
  onBack, 
  onBackToPatientList 
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showNewRecordForm, setShowNewRecordForm] = useState(false);

  const config = SPECIALTY_CONFIG[specialty as keyof typeof SPECIALTY_CONFIG];
  const canWrite = hasPermission(user?.position || '', 'write', specialty);
  const userSpecialty = mapPositionToSpecialty(user?.position || '');
  const isUserSpecialty = userSpecialty === specialty;

  // Mock data - Em produção, isso viria do contexto
  const records: any[] = []; // TODO: Implementar busca real

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
      'Users': Users,
    };
    return icons[iconName] || FileText;
  };

  const Icon = getSpecialtyIcon(config.icon);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium mr-4"
              >
                <ArrowLeft size={20} className="mr-2" />
                Voltar ao Prontuário
              </button>
              <div className="text-gray-400">•</div>
              <button
                onClick={onBackToPatientList}
                className="ml-4 text-blue-600 hover:text-blue-700 transition-colors font-medium"
              >
                Lista de Pacientes
              </button>
            </div>
            <div className="flex items-center space-x-4">
              {canWrite && (
                <button
                  onClick={() => setShowNewRecordForm(true)}
                  className={`flex items-center px-4 py-2 ${config.buttonColor} text-white rounded-lg transition-colors font-medium`}
                >
                  <Plus size={18} className="mr-2" />
                  Nova Anotação
                </button>
              )}
              <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <Download size={18} className="mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Patient Info Bar */}
        <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-6 mb-8`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`p-4 ${config.buttonColor.split(' ')[0]} rounded-xl mr-4`}>
                <Icon className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Evolução de {config.name} - {guest.fullName}
                </h1>
                <div className="flex items-center space-x-4 text-gray-600">
                  <span>{calculateAge(guest.birthDate)} anos • {guest.gender}</span>
                  <span>Quarto {guest.roomNumber}</span>
                  <span>Grau {guest.dependencyLevel}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`${config.textColor} font-bold text-lg`}>
                {records.length} evoluções
              </div>
              <div className="text-sm text-gray-600">
                {canWrite ? 'Você pode evoluir' : 'Somente leitura'}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar em evoluções..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Calendar size={18} className="mr-2 text-gray-600" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        {/* Records Timeline */}
        {records.length > 0 ? (
          <div className="space-y-4">
            {records.map((record: any, index: number) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
                {/* Record content would go here */}
                <div className="text-center py-8 text-gray-500">
                  Conteúdo da anotação {index + 1}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 ${config.bgColor} rounded-full mb-4`}>
              <Icon className={config.textColor} size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma evolução de {config.name}
            </h3>
            <p className="text-gray-600 mb-6">
              {canWrite 
                ? `Seja o primeiro a fazer uma evolução de ${config.name} para este paciente.`
                : `Ainda não há evoluções de ${config.name} para este paciente.`
              }
            </p>
            {canWrite && (
              <button
                onClick={() => setShowNewRecordForm(true)}
                className={`inline-flex items-center px-6 py-3 ${config.buttonColor} text-white rounded-lg transition-colors font-medium`}
              >
                <Plus size={20} className="mr-2" />
                Primeira Evolução de {config.name}
              </button>
            )}
          </div>
        )}

        {/* Access Info */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <User className="text-blue-600" size={16} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Informações de Acesso</h4>
              <p className="text-sm text-gray-600">
                Você está visualizando as evoluções de <strong>{config.name}</strong> como <strong>{user?.position}</strong>.
                {canWrite ? ' Você tem permissão para criar novas evoluções.' : ' Você tem acesso somente leitura.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal Placeholder */}
      {showNewRecordForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Nova Evolução de {config.name}
              </h2>
              <button
                onClick={() => setShowNewRecordForm(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <Icon className={config.textColor} size={48} />
                <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
                  Formulário de Evolução - {config.name}
                </h3>
                <p className="text-gray-600">
                  Formulário específico para evoluções de {config.name} será implementado aqui.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};