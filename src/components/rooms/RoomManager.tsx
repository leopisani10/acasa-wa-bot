import React, { useState } from 'react';
import { useRooms } from '../../contexts/RoomContext';
import { Building, Plus } from 'lucide-react';
import RoomCard from './RoomCard';
import RoomFormModal from './RoomFormModal';

const RoomManager: React.FC = () => {
  const { rooms, loading, error, getRoomsByFloor } = useRooms();
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Erro ao carregar quartos: {error}
      </div>
    );
  }

  const floors = [1, 2, 3]; // Display from first to third floor

  const getFloorStats = (floor: number) => {
    const floorRooms = getRoomsByFloor(floor);
    const totalActiveBeds = floorRooms.reduce(
      (sum, room) => sum + room.beds.filter(bed => bed.status === 'Ativa').length,
      0
    );
    const totalInactiveBeds = floorRooms.reduce(
      (sum, room) => sum + room.beds.filter(bed => bed.status === 'Inativa').length,
      0
    );
    const occupiedBeds = floorRooms.reduce(
      (sum, room) => sum + room.beds.filter(bed => bed.status === 'Ativa' && bed.guestId).length,
      0
    );
    return {
      totalRooms: floorRooms.length,
      totalBeds: totalActiveBeds,
      inactiveBeds: totalInactiveBeds,
      occupiedBeds,
      availableBeds: totalActiveBeds - occupiedBeds
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Quartos</h2>
          <p className="text-gray-600 mt-1">Organize quartos e aloque hóspedes nas camas</p>
        </div>
        <button
          onClick={() => setShowRoomForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Quarto
        </button>
      </div>

      {/* Floor Selection */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {floors.map(floor => {
          const stats = getFloorStats(floor);
          const isSelected = selectedFloor === floor;
          return (
            <button
              key={floor}
              onClick={() => setSelectedFloor(isSelected ? null : floor)}
              className={`text-left transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-lg scale-105 border-l-4 border-blue-800'
                  : 'bg-white hover:bg-gray-50 border-l-4 border-blue-500 hover:shadow-md'
              } rounded-lg shadow p-6`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                    {floor}º Andar
                  </p>
                  <p className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {stats.totalRooms} {stats.totalRooms === 1 ? 'quarto' : 'quartos'}
                  </p>
                  <p className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                    {stats.occupiedBeds}/{stats.totalBeds} camas ativas ocupadas
                  </p>
                  {stats.inactiveBeds > 0 && (
                    <p className={`text-xs font-medium mt-1 ${
                      isSelected ? 'text-yellow-300' : 'text-amber-600'
                    }`}>
                      {stats.inactiveBeds} {stats.inactiveBeds === 1 ? 'cama inativa' : 'camas inativas'}
                    </p>
                  )}
                </div>
                <Building className={`w-10 h-10 ${isSelected ? 'text-white opacity-30' : 'text-blue-500 opacity-20'}`} />
              </div>
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-blue-500">
                  <p className="text-xs text-blue-100 font-medium">
                    Clique novamente para mostrar todos os andares
                  </p>
                </div>
              )}
            </button>
          );
        })}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100">Total Geral</p>
              <p className="text-2xl font-bold">{rooms.length}</p>
              <p className="text-xs text-blue-100">quartos cadastrados</p>
              {(() => {
                const totalActive = floors.reduce((sum, f) => sum + getFloorStats(f).totalBeds, 0);
                const totalInactive = floors.reduce((sum, f) => sum + getFloorStats(f).inactiveBeds, 0);
                return (
                  <>
                    <p className="text-xs text-blue-100 mt-1">{totalActive} camas ativas</p>
                    {totalInactive > 0 && (
                      <p className="text-xs text-amber-300 font-medium">{totalInactive} camas inativas</p>
                    )}
                  </>
                );
              })()}
            </div>
            <Building className="w-10 h-10 text-white opacity-30" />
          </div>
        </div>
      </div>

      {/* Rooms by Floor */}
      {selectedFloor === null ? (
        // Show all floors when none is selected
        floors.map(floor => {
          const floorRooms = getRoomsByFloor(floor);

          if (floorRooms.length === 0) return null;

          return (
            <div key={floor} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg">
                  <Building className="w-5 h-5" />
                  <span className="font-semibold">{floor}º Andar</span>
                </div>
                <div className="h-px flex-1 bg-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {floorRooms.map(room => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        // Show only selected floor
        (() => {
          const floorRooms = getRoomsByFloor(selectedFloor);

          if (floorRooms.length === 0) {
            return (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum quarto no {selectedFloor}º andar
                </h3>
                <p className="text-gray-600 mb-4">
                  Comece criando um quarto neste andar
                </p>
                <button
                  onClick={() => setShowRoomForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Criar Quarto
                </button>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md">
                  <Building className="w-5 h-5" />
                  <span className="font-semibold">{selectedFloor}º Andar</span>
                </div>
                <div className="h-px flex-1 bg-gray-200"></div>
                <button
                  onClick={() => setSelectedFloor(null)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ver todos os andares
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {floorRooms.map(room => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            </div>
          );
        })()
      )}

      {/* Empty State */}
      {rooms.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum quarto cadastrado</h3>
          <p className="text-gray-600 mb-4">Comece criando seu primeiro quarto</p>
          <button
            onClick={() => setShowRoomForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Criar Primeiro Quarto
          </button>
        </div>
      )}

      {/* Room Form Modal */}
      {showRoomForm && (
        <RoomFormModal
          onClose={() => setShowRoomForm(false)}
        />
      )}
    </div>
  );
};

export default RoomManager;
