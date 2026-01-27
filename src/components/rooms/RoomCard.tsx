import React, { useState } from 'react';
import { RoomWithBeds, BedWithGuest } from '../../types';
import { Bed, User, Edit, Trash2, UserX, BedDouble, XCircle, CheckCircle } from 'lucide-react';
import BedAllocationModal from './BedAllocationModal';
import RoomFormModal from './RoomFormModal';
import { useRooms } from '../../contexts/RoomContext';
import { useAuth } from '../../contexts/AuthContext';

interface RoomCardProps {
  room: RoomWithBeds;
}

const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const { deleteRoom, allocateGuestToBed, updateBed } = useRooms();
  const { user } = useAuth();
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [selectedBedForStatus, setSelectedBedForStatus] = useState<BedWithGuest | null>(null);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [statusReason, setStatusReason] = useState('');

  // Calcular baseado apenas em camas ativas
  const activeBeds = room.beds.filter(bed => bed.status === 'Ativa');
  const inactiveBeds = room.beds.filter(bed => bed.status === 'Inativa');
  const occupiedBeds = activeBeds.filter(bed => bed.guestId).length;
  const availableBeds = activeBeds.length - occupiedBeds;
  const occupancyRate = activeBeds.length > 0 ? (occupiedBeds / activeBeds.length) * 100 : 0;

  // Identificar tipo de quarto baseado em camas ativas
  const getRoomType = () => {
    if (activeBeds.length === 1) return 'Individual';
    if (activeBeds.length === 2) return 'Duplo';
    if (activeBeds.length === 3) return 'Triplo';
    return `${activeBeds.length} camas`;
  };

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

  const handleOpenStatusModal = (bed: BedWithGuest) => {
    setSelectedBedForStatus(bed);
    setStatusReason(bed.inactiveReason || '');
    setShowStatusModal(true);
  };

  const handleToggleBedStatus = async () => {
    if (!selectedBedForStatus) return;

    try {
      const newStatus = selectedBedForStatus.status === 'Ativa' ? 'Inativa' : 'Ativa';

      if (newStatus === 'Inativa' && !statusReason.trim()) {
        alert('Por favor, informe o motivo da desativação');
        return;
      }

      await updateBed(selectedBedForStatus.id, {
        status: newStatus,
        inactiveReason: newStatus === 'Inativa' ? statusReason : undefined,
        deactivatedAt: newStatus === 'Inativa' ? new Date().toISOString() : undefined,
        deactivatedBy: newStatus === 'Inativa' ? user?.name : undefined,
      });

      setShowStatusModal(false);
      setSelectedBedForStatus(null);
      setStatusReason('');
    } catch (error) {
      alert('Erro ao atualizar status da cama');
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
              <p className="text-sm text-blue-100">{room.floor}º Andar • {getRoomType()}</p>
              {inactiveBeds.length > 0 && (
                <p className="text-xs text-blue-200 mt-1">
                  ({inactiveBeds.length} cama{inactiveBeds.length > 1 ? 's' : ''} inativa{inactiveBeds.length > 1 ? 's' : ''})
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{occupiedBeds}/{activeBeds.length}</p>
              <p className="text-xs text-blue-100">camas ativas</p>
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
          {/* Active Beds */}
          {activeBeds.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Camas Ativas</h4>
              <div className="grid grid-cols-2 gap-3">
                {activeBeds.map(bed => (
                  <div
                    key={bed.id}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      bed.guestId
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Bed className={`w-5 h-5 ${bed.guestId ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="text-sm font-semibold text-gray-700">Cama {bed.bedNumber}</span>
                      </div>
                      <div className="flex items-center gap-1">
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStatusModal(bed);
                          }}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                          title="Desativar cama"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
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
                        <button
                          onClick={() => handleBedClick(bed.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Clique para alocar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inactive Beds */}
          {inactiveBeds.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Camas Inativas</h4>
              <div className="grid grid-cols-2 gap-3">
                {inactiveBeds.map(bed => (
                  <div
                    key={bed.id}
                    className="relative p-4 rounded-lg border-2 border-gray-300 bg-gray-100 opacity-75"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BedDouble className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-500">Cama {bed.bedNumber}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenStatusModal(bed);
                        }}
                        className="text-green-500 hover:text-green-700 transition-colors"
                        title="Reativar cama"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-center py-1">
                      <p className="text-xs text-gray-600 font-medium">Inativa</p>
                      {bed.inactiveReason && (
                        <p className="text-xs text-gray-500 mt-1 italic" title={bed.inactiveReason}>
                          {bed.inactiveReason.length > 30
                            ? bed.inactiveReason.substring(0, 30) + '...'
                            : bed.inactiveReason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Room Info */}
          {room.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
              <p className="text-sm text-gray-700">{room.notes}</p>
            </div>
          )}

          {/* Room Actions */}
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
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

      {/* Edit Room Modal */}
      {showEditModal && (
        <RoomFormModal
          room={room}
          onClose={() => setShowEditModal(false)}
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

      {/* Bed Status Modal */}
      {showStatusModal && selectedBedForStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedBedForStatus.status === 'Ativa' ? 'Desativar' : 'Reativar'} Cama {selectedBedForStatus.bedNumber}
            </h3>

            {selectedBedForStatus.status === 'Ativa' ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Ao desativar esta cama, ela não será mais contabilizada na capacidade do quarto e não poderá receber hóspedes.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo da desativação <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  >
                    <option value="">Selecione um motivo...</option>
                    <option value="Adequação para quarto individual">Adequação para quarto individual</option>
                    <option value="Adequação para quarto duplo">Adequação para quarto duplo</option>
                    <option value="Redução de capacidade">Redução de capacidade</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Reforma do quarto">Reforma do quarto</option>
                    <option value="Outro">Outro</option>
                  </select>

                  {statusReason === 'Outro' && (
                    <textarea
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="Descreva o motivo..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-xs text-gray-600">
                    <strong>Nota:</strong> Esta informação ficará registrada no histórico da cama para rastreabilidade.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Ao reativar esta cama, ela voltará a ser contabilizada na capacidade do quarto e poderá receber hóspedes novamente.
                </p>

                {selectedBedForStatus.inactiveReason && (
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Motivo da desativação anterior:</p>
                    <p className="text-sm text-gray-600">{selectedBedForStatus.inactiveReason}</p>
                    {selectedBedForStatus.deactivatedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Desativada em: {new Date(selectedBedForStatus.deactivatedAt).toLocaleDateString('pt-BR')}
                        {selectedBedForStatus.deactivatedBy && ` por ${selectedBedForStatus.deactivatedBy}`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedBedForStatus(null);
                  setStatusReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleToggleBedStatus}
                className={`flex-1 px-4 py-2 text-white rounded-lg ${
                  selectedBedForStatus.status === 'Ativa'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {selectedBedForStatus.status === 'Ativa' ? 'Desativar' : 'Reativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoomCard;
