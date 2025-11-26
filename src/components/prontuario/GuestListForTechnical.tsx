import React, { useState } from 'react';
import { Search, User, MapPin, Calendar, FileText, AlertTriangle, Filter, Users, Stethoscope } from 'lucide-react';
import { useGuests } from '../../contexts/GuestContext';
import { useAuth } from '../../contexts/AuthContext';
import { Guest } from '../../types';

interface GuestListForTechnicalProps {
  onSelectGuest: (guest: Guest) => void;
}

export const GuestListForTechnical: React.FC<GuestListForTechnicalProps> = ({ onSelectGuest }) => {
  const { guests } = useGuests();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState<'my-unit' | 'all'>('my-unit');

  // Filtrar hóspedes ativos
  const activeGuestsInUnit = guests.filter(guest => {
    const isActive = guest.status === 'Ativo';
    const unitMatch = unitFilter === 'all' || guest.unit === user?.unit;
    return isActive && unitMatch;
  });

  const filteredGuests = activeGuestsInUnit.filter(guest =>
    guest.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.roomNumber.includes(searchTerm)
  );

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 p-4 rounded-xl mr-4">
                <Stethoscope className="text-white" size={32} />
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold mb-2 font-sans">
                  Prontuário Eletrônico
                </h1>
                <p className="text-blue-100 text-lg font-sans">
                  Sistema de Evoluções Multidisciplinares
                </p>
                <p className="text-blue-200 text-sm font-sans">
                  Profissional: {user?.name} • {user?.position} • Unidade {user?.unit}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="text-2xl font-bold">{filteredGuests.length}</div>
                <div className="text-sm text-blue-100">Pacientes Disponíveis</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar paciente por nome ou quarto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans text-base"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Filter className="text-gray-600 mr-2" size={18} />
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value as 'my-unit' | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
              >
                <option value="my-unit">Minha Unidade ({user?.unit})</option>
                <option value="all">Todas as Unidades</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              <strong>{filteredGuests.length}</strong> pacientes
            </div>
          </div>
        </div>
      </div>

      {/* Empty State - More Intuitive */}
      {filteredGuests.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          {guests.length === 0 ? (
            <>
              <div className="bg-red-50 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 font-sans">
                Nenhum Paciente Encontrado
              </h3>
              <p className="text-gray-600 mb-6 font-sans">
                Não há pacientes cadastrados no sistema. Entre em contato com o administrador 
                para verificar se os dados foram importados corretamente.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-700 font-sans">
                  <strong>Dica:</strong> Se você é administrador, vá para a seção "Hóspedes" 
                  para cadastrar ou importar os dados dos pacientes.
                </p>
              </div>
            </>
          ) : activeGuestsInUnit.length === 0 ? (
            <>
              <div className="bg-orange-50 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Users className="text-orange-500" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 font-sans">
                Nenhum Paciente na Sua Unidade
              </h3>
              <p className="text-gray-600 mb-4 font-sans">
                Não há pacientes ativos cadastrados para a unidade <strong>{user?.unit}</strong>.
              </p>
              <button
                onClick={() => setUnitFilter('all')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-sans"
              >
                <Users size={18} className="mr-2" />
                Ver Todas as Unidades
              </button>
            </>
          ) : (
            <>
              <div className="bg-blue-50 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Search className="text-blue-500" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 font-sans">
                Nenhum Resultado Encontrado
              </h3>
              <p className="text-gray-600 mb-4 font-sans">
                Não encontramos pacientes com "<strong>{searchTerm}</strong>".
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-sans"
              >
                Limpar Busca
              </button>
            </>
          )}
        </div>
      )}

      {/* Guest Grid */}
      {filteredGuests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredGuests.map((guest) => (
          <div 
            key={guest.id} 
            className="group bg-white rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
            onClick={() => onSelectGuest(guest)}
          >
            <div className="p-6 relative overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {guest.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="text-right">
                  <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                    Quarto {guest.roomNumber}
                  </div>
                </div>
              </div>
              
              {/* Patient Info */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3 font-sans leading-tight">
                  {guest.fullName}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar size={14} className="mr-2 text-blue-500 flex-shrink-0" />
                    <span className="font-sans">{calculateAge(guest.birthDate)} anos • {guest.gender}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin size={14} className="mr-2 text-blue-500 flex-shrink-0" />
                    <span className="font-sans">{guest.unit}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <User size={14} className="mr-2 text-blue-500 flex-shrink-0" />
                    <span className="font-sans">Grau {guest.dependencyLevel}</span>
                  </div>
                </div>
              </div>

              {/* Medical Info */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-sans">Plano de Saúde:</span>
                    <span className="font-medium text-gray-900 font-sans">{guest.healthPlan || 'Não informado'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-sans">Fono:</span>
                    <span className={`font-medium font-sans ${guest.hasSpeechTherapy ? 'text-green-600' : 'text-gray-400'}`}>
                      {guest.hasSpeechTherapy ? '✓' : '○'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium font-sans text-base group-hover:shadow-lg">
                <div className="flex items-center justify-center">
                  <FileText size={18} className="mr-2" />
                  Acessar Prontuário
                </div>
              </button>
              
              {/* Hover Effect Gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"></div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Quick Access Info */}
      {filteredGuests.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-700 font-sans">
            <strong>💡 Dica:</strong> Clique em qualquer paciente para acessar seu prontuário e criar novas evoluções multidisciplinares
          </p>
        </div>
      )}
    </div>
  );
};