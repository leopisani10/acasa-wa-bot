import React, { useState, useEffect } from 'react';
import { X, Search, User, UserCheck } from 'lucide-react';
import { useRooms } from '../../contexts/RoomContext';
import { useGuests } from '../../contexts/GuestContext';
import { Guest } from '../../types';

interface BedAllocationModalProps {
  bedId: string;
  currentGuest: Guest | null;
  onClose: () => void;
}

const BedAllocationModal: React.FC<BedAllocationModalProps> = ({
  bedId,
  currentGuest,
  onClose,
}) => {
  const { allocateGuestToBed, rooms } = useRooms();
  const { guests } = useGuests();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(currentGuest?.id || null);
  const [isLoading, setIsLoading] = useState(false);

  // Get all allocated guest IDs (except current guest in this bed)
  const allocatedGuestIds = new Set(
    rooms
      .flatMap(room => room.beds)
      .filter(bed => bed.guestId && bed.id !== bedId) // Exclude current bed
      .map(bed => bed.guestId)
      .filter(Boolean) as string[]
  );

  // Filter only active guests that are not already allocated
  const activeGuests = guests.filter(g =>
    g.status === 'Ativo' &&
    (!allocatedGuestIds.has(g.id) || g.id === currentGuest?.id) // Allow current guest
  );

  // Filter guests based on search
  const filteredGuests = activeGuests.filter(guest =>
    guest.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.cpf.includes(searchTerm)
  );

  const handleAllocate = async () => {
    try {
      setIsLoading(true);
      await allocateGuestToBed(bedId, selectedGuestId);
      onClose();
    } catch (error) {
      alert('Erro ao alocar hóspede');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Alocar Hóspede</h2>
            <p className="text-sm text-blue-100">Selecione um hóspede para alocar nesta cama</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Guest Info */}
        {currentGuest && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Atualmente alocado: {currentGuest.fullName}
              </span>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou CPF..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
          {allocatedGuestIds.size > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {allocatedGuestIds.size} hóspede(s) já alocado(s) em outras camas não aparecem na lista
            </p>
          )}
        </div>

        {/* Guest List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            {filteredGuests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Nenhum hóspede encontrado</p>
              </div>
            ) : (
              filteredGuests.map(guest => (
                <label
                  key={guest.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedGuestId === guest.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="guest"
                    value={guest.id}
                    checked={selectedGuestId === guest.id}
                    onChange={() => setSelectedGuestId(guest.id)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <User className={`w-5 h-5 ${selectedGuestId === guest.id ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{guest.fullName}</p>
                    <p className="text-sm text-gray-500">
                      CPF: {guest.cpf} • {guest.gender} • Nível {guest.dependencyLevel}
                    </p>
                  </div>
                  {guest.id === currentGuest?.id && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      Atual
                    </span>
                  )}
                </label>
              ))
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          {currentGuest && (
            <button
              onClick={async () => {
                try {
                  setIsLoading(true);
                  await allocateGuestToBed(bedId, null);
                  onClose();
                } catch (error) {
                  alert('Erro ao remover hóspede');
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Remover Hóspede
            </button>
          )}
          <button
            onClick={handleAllocate}
            disabled={!selectedGuestId || isLoading || selectedGuestId === currentGuest?.id}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Alocando...' : 'Alocar Hóspede'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BedAllocationModal;
