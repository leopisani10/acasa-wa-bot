import React, { useState } from 'react';
import { X, Building } from 'lucide-react';
import { useRooms } from '../../contexts/RoomContext';

interface RoomFormModalProps {
  onClose: () => void;
}

const RoomFormModal: React.FC<RoomFormModalProps> = ({ onClose }) => {
  const { addRoom } = useRooms();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    roomNumber: '',
    floor: 1 as 1 | 2 | 3,
    bedCount: 1,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.roomNumber.trim()) {
      alert('Por favor, informe o número do quarto');
      return;
    }

    if (formData.bedCount < 1 || formData.bedCount > 10) {
      alert('O número de camas deve estar entre 1 e 10');
      return;
    }

    try {
      setIsLoading(true);
      await addRoom(formData);
      onClose();
    } catch (error) {
      alert('Erro ao criar quarto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3">
            <Building className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Novo Quarto</h2>
              <p className="text-sm text-blue-100">Cadastre um novo quarto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Room Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número do Quarto *
            </label>
            <input
              type="text"
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: 101, 201A, 305"
              required
            />
          </div>

          {/* Floor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Andar *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(floor => (
                <button
                  key={floor}
                  type="button"
                  onClick={() => setFormData({ ...formData, floor: floor as 1 | 2 | 3 })}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.floor === floor
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {floor}º Andar
                </button>
              ))}
            </div>
          </div>

          {/* Bed Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantidade de Camas *
            </label>
            <input
              type="number"
              value={formData.bedCount}
              onChange={(e) => setFormData({ ...formData, bedCount: parseInt(e.target.value) || 1 })}
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Máximo: 10 camas por quarto</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Informações adicionais sobre o quarto..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Criando...' : 'Criar Quarto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomFormModal;
