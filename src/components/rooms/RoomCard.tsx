import React, { useState } from 'react';
import { RoomWithBeds } from '../../types';
import { Bed, User, Edit, Trash2, UserX } from 'lucide-react';
import BedAllocationModal from './BedAllocationModal';
import { useRooms } from '../../contexts/RoomContext';

interface RoomCardProps {
  room: RoomWithBeds;
}

const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const { deleteRoom, allocateGuestToBed } = useRooms();
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const occupiedBeds = room.beds.filter(bed => bed.guestId).length;
  const availableBeds = room.bedCount - occupiedBeds;
  const occupancyRate = (occupiedBeds / room.bedCount) * 100;

  const handleBedClick = (bedId: string) => {
    setSelectedBedId(bedId);
    setShowAllocationModal(true);
  };

  const handleRemoveGuest = async (bedId: string) => {
    if (confirm('Deseja remover o hóspede desta cama?')) {
      try {
        await allocateGuestToBed(bedId, null);
      } catch (error) {
        alert('Erro ao remover hóspede');
      }
    }
  };

  const handleDeleteRoom = async () => {
    try {
      await deleteRoom(room.id);
      setShowDeleteConfirm(false);
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir quarto');
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
        {/* Room Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
          <div className="flex items-center justify-between text-white">
            <div>
              <h3 className="text-xl font-bold">Quarto {room.roomNumber}</h3>
              <p className="text-sm text-blue-100">{room.floor}º Andar</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{occupiedBeds}/{room.bedCount}</p>
              <p className="text-xs text-blue-100">ocupação</p>
            </div>
          </div>
        </div>

        {/* Occupancy Bar */}
        <div className="h-2 bg-gray-200">
          <div
            className={`h-full transition-all ${
              occupancyRate === 100 ? 'bg-red-500' : occupancyRate > 50 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${occupancyRate}%` }}
          />
        </div>

        {/* Beds Grid */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {room.beds.map(bed => (
              <div
                key={bed.id}
                onClick={() => handleBedClick(bed.id)}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  bed.guestId
                    ? 'border-blue-300 bg-blue-50 hover:bg-blue-100'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bed className={`w-5 h-5 ${bed.guestId ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-semibold text-gray-700">Cama {bed.bedNumber}</span>
                  </div>
                  {bed.guestId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveGuest(bed.id);
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Remover hóspede"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {bed.guest ? (
                  <div className="flex items-center gap-2 mt-2">
                    <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate" title={bed.guest.fullName}>
                        {bed.guest.fullName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {bed.guest.gender} • {bed.guest.dependencyLevel}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-gray-500">Clique para alocar</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Room Info */}
          {room.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
              <p className="text-sm text-gray-700">{room.notes}</p>
            </div>
          )}

          {/* Room Actions */}
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          </div>
        </div>
      </div>

      {/* Bed Allocation Modal */}
      {showAllocationModal && selectedBedId && (
        <BedAllocationModal
          bedId={selectedBedId}
          currentGuest={room.beds.find(b => b.id === selectedBedId)?.guest || null}
          onClose={() => {
            setShowAllocationModal(false);
            setSelectedBedId(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o quarto {room.roomNumber}?
              {occupiedBeds > 0 && (
                <span className="text-red-600 font-semibold block mt-2">
                  Este quarto possui {occupiedBeds} cama(s) ocupada(s) e não pode ser excluído.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteRoom}
                disabled={occupiedBeds > 0}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoomCard;
