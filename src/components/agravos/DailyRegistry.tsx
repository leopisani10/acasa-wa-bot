import React, { useState, useEffect } from 'react';
import { Calendar, Save, Plus, Trash2, AlertTriangle, Users } from 'lucide-react';
import { useAgravos } from '../../contexts/AgravosContext';
import { useGuests } from '../../contexts/GuestContext';
import { DailyAgravosRecord, AgravoEvent } from '../../types/agravos';

interface DailyRegistryProps {
  selectedDate: string;
  selectedUnit: 'Botafogo' | 'Tijuca';
}

export const DailyRegistry: React.FC<DailyRegistryProps> = ({ selectedDate, selectedUnit }) => {
  const { getDailyRecord, addDailyRecord, updateDailyRecord, addEvent, updateEvent, removeEvent } = useAgravos();
  const { guests } = useGuests();
  const [currentRecord, setCurrentRecord] = useState<DailyAgravosRecord | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgravoEvent | null>(null);

  const date = new Date(selectedDate);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const activeResidents = guests.filter(guest => 
    guest.status === 'Ativo' && guest.unit === selectedUnit
  );

  useEffect(() => {
    const record = getDailyRecord(selectedDate, selectedUnit);
    if (record) {
      setCurrentRecord(record);
    } else {
      // Criar registro em branco se não existir
      const newRecord: Omit<DailyAgravosRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
        unit: selectedUnit,
        date: selectedDate,
        month,
        year,
        quedaComLesao: 0,
        quedaSemLesao: 0,
        lesaoPorPressao: 0,
        diarreia: 0,
        escabiose: 0,
        desidratacao: 0,
        obito: 0,
        tentativaSuicidio: 0,
        observacoes: '',
        eventos: [],
      };
      setCurrentRecord(newRecord as DailyAgravosRecord);
    }
  }, [selectedDate, selectedUnit, getDailyRecord]);

  const agravoTypes = [
    { key: 'quedaComLesao', label: 'Queda com lesão', color: 'bg-red-100 text-red-700' },
    { key: 'quedaSemLesao', label: 'Queda sem lesão', color: 'bg-orange-100 text-orange-700' },
    { key: 'lesaoPorPressao', label: 'Lesão por pressão', color: 'bg-purple-100 text-purple-700' },
    { key: 'diarreia', label: 'Diarreia', color: 'bg-yellow-100 text-yellow-700' },
    { key: 'escabiose', label: 'Escabiose', color: 'bg-pink-100 text-pink-700' },
    { key: 'desidratacao', label: 'Desidratação', color: 'bg-blue-100 text-blue-700' },
    { key: 'obito', label: 'Óbito', color: 'bg-gray-800 text-white' },
    { key: 'tentativaSuicidio', label: 'Tentativa de suicídio', color: 'bg-red-800 text-white' },
  ];

  const handleCountChange = (field: string, value: number) => {
    if (!currentRecord) return;
    
    const updatedRecord = { ...currentRecord, [field]: value };
    setCurrentRecord(updatedRecord);
  };

  const handleObservationsChange = (value: string) => {
    if (!currentRecord) return;
    
    const updatedRecord = { ...currentRecord, observacoes: value };
    setCurrentRecord(updatedRecord);
  };

  const handleSave = () => {
    if (!currentRecord) return;

    // Validar se há observações quando há eventos
    const hasEvents = agravoTypes.some(type => 
      (currentRecord as any)[type.key] > 0
    );

    if (hasEvents && !currentRecord.observacoes.trim()) {
      alert('Observações são obrigatórias quando há eventos registrados.');
      return;
    }

    if (currentRecord.id && currentRecord.createdAt) {
      // Atualizar registro existente
      updateDailyRecord(currentRecord.id, currentRecord);
    } else {
      // Criar novo registro
      addDailyRecord(currentRecord);
    }
  };

  const hasAnyEvents = currentRecord && agravoTypes.some(type => 
    (currentRecord as any)[type.key] > 0
  );

  const handleAddEvent = (tipo: string) => {
    setEditingEvent({
      id: '',
      tipo: tipo as any,
      data: selectedDate,
      residenteNome: '',
      descricao: '',
      condutaAdotada: '',
      resolucao: '',
      responsavel: '',
      horario: '',
    });
    setShowEventForm(true);
  };

  const handleSaveEvent = (eventData: Omit<AgravoEvent, 'id'>) => {
    if (!currentRecord) return;

    if (editingEvent && editingEvent.id) {
      // Atualizar evento existente
      updateEvent(currentRecord.id, editingEvent.id, eventData);
    } else {
      // Adicionar novo evento
      if (currentRecord.id) {
        addEvent(currentRecord.id, eventData);
      } else {
        // Se o registro ainda não foi salvo, adicionar ao estado local
        const newEvent: AgravoEvent = {
          ...eventData,
          id: Date.now().toString(),
        };
        setCurrentRecord(prev => prev ? {
          ...prev,
          eventos: [...prev.eventos, newEvent]
        } : null);
      }
    }
    setShowEventForm(false);
    setEditingEvent(null);
  };

  if (!currentRecord) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="text-red-600 mr-3" size={20} />
            <div>
              <h3 className="font-semibold text-red-800">
                Registro Diário de Agravos
              </h3>
              <p className="text-sm text-red-600">
                {new Date(selectedDate).toLocaleDateString('pt-BR')} • {selectedUnit} • {activeResidents.length} residentes ativos
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Save size={16} className="mr-2" />
            Salvar Dia
          </button>
        </div>
      </div>

      {/* Validation Alert */}
      {hasAnyEvents && !currentRecord.observacoes.trim() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="text-yellow-600 mr-2" size={20} />
            <span className="text-yellow-800 font-medium">
              Observações são obrigatórias quando há eventos registrados!
            </span>
          </div>
        </div>
      )}

      {/* Agravos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {agravoTypes.map(type => (
          <div key={type.key} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 text-sm">{type.label}</h4>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${type.color}`}>
                {(currentRecord as any)[type.key]}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCountChange(type.key, Math.max(0, (currentRecord as any)[type.key] - 1))}
                className="w-8 h-8 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                disabled={(currentRecord as any)[type.key] === 0}
              >
                -
              </button>
              <input
                type="number"
                min="0"
                value={(currentRecord as any)[type.key]}
                onChange={(e) => handleCountChange(type.key, parseInt(e.target.value) || 0)}
                className="w-16 text-center py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <button
                onClick={() => handleCountChange(type.key, (currentRecord as any)[type.key] + 1)}
                className="w-8 h-8 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
              >
                +
              </button>
            </div>

            {(currentRecord as any)[type.key] > 0 && (
              <button
                onClick={() => handleAddEvent(type.label)}
                className="w-full mt-2 flex items-center justify-center px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
              >
                <Plus size={12} className="mr-1" />
                Detalhar Evento
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Observações */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">
          Observações do Dia {hasAnyEvents && <span className="text-red-600">*</span>}
        </h4>
        <textarea
          value={currentRecord.observacoes}
          onChange={(e) => handleObservationsChange(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
            hasAnyEvents ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
          rows={4}
          placeholder={hasAnyEvents 
            ? "Observações obrigatórias: descreva os eventos ocorridos no dia..."
            : "Observações gerais do dia (opcional)..."
          }
          required={hasAnyEvents}
        />
        {hasAnyEvents && (
          <p className="text-xs text-red-600 mt-1">
            * Campo obrigatório quando há eventos registrados
          </p>
        )}
      </div>

      {/* Eventos Detalhados */}
      {currentRecord.eventos.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Eventos Detalhados</h4>
          <div className="space-y-3">
            {currentRecord.eventos.map(event => (
              <div key={event.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{event.tipo}</div>
                    <div className="text-sm text-gray-600">
                      {event.residenteNome} • {event.data} {event.horario && `às ${event.horario}`}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {
                        setEditingEvent(event);
                        setShowEventForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => removeEvent(currentRecord.id, event.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <div><strong>Descrição:</strong> {event.descricao}</div>
                  <div><strong>Conduta:</strong> {event.condutaAdotada}</div>
                  <div><strong>Resolução:</strong> {event.resolucao}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <EventForm
              event={editingEvent}
              availableResidents={activeResidents}
              onSave={handleSaveEvent}
              onClose={() => {
                setShowEventForm(false);
                setEditingEvent(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para formulário de evento
interface EventFormProps {
  event: AgravoEvent | null;
  availableResidents: any[];
  onSave: (event: Omit<AgravoEvent, 'id'>) => void;
  onClose: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ event, availableResidents, onSave, onClose }) => {
  const [formData, setFormData] = useState<Omit<AgravoEvent, 'id'>>({
    tipo: event?.tipo || 'Queda com lesão',
    data: event?.data || new Date().toISOString().split('T')[0],
    residenteNome: event?.residenteNome || '',
    residenteId: event?.residenteId || '',
    descricao: event?.descricao || '',
    condutaAdotada: event?.condutaAdotada || '',
    resolucao: event?.resolucao || '',
    responsavel: event?.responsavel || '',
    horario: event?.horario || '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleResidentChange = (residenteId: string) => {
    const resident = availableResidents.find(r => r.id === residenteId);
    if (resident) {
      setFormData(prev => ({
        ...prev,
        residenteId,
        residenteNome: resident.fullName,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <>
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">
          {event ? 'Editar Evento' : 'Novo Evento'}
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Agravo *
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => handleInputChange('tipo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              <option value="Queda com lesão">Queda com lesão</option>
              <option value="Queda sem lesão">Queda sem lesão</option>
              <option value="Lesão por pressão">Lesão por pressão</option>
              <option value="Diarreia">Diarreia</option>
              <option value="Escabiose">Escabiose</option>
              <option value="Desidratação">Desidratação</option>
              <option value="Óbito">Óbito</option>
              <option value="Tentativa de suicídio">Tentativa de suicídio</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Residente Afetado *
            </label>
            <select
              value={formData.residenteId}
              onChange={(e) => handleResidentChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              <option value="">Selecione o residente...</option>
              {availableResidents.map(resident => (
                <option key={resident.id} value={resident.id}>
                  {resident.fullName} - Quarto {resident.roomNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data da Ocorrência *
            </label>
            <input
              type="date"
              value={formData.data}
              onChange={(e) => handleInputChange('data', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horário
            </label>
            <input
              type="time"
              value={formData.horario}
              onChange={(e) => handleInputChange('horario', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição do Evento *
          </label>
          <textarea
            value={formData.descricao}
            onChange={(e) => handleInputChange('descricao', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            rows={3}
            placeholder="Descreva detalhadamente o que aconteceu..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Conduta Adotada *
          </label>
          <textarea
            value={formData.condutaAdotada}
            onChange={(e) => handleInputChange('condutaAdotada', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            rows={2}
            placeholder="Quais medidas foram tomadas imediatamente..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resolução *
          </label>
          <textarea
            value={formData.resolucao}
            onChange={(e) => handleInputChange('resolucao', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            rows={2}
            placeholder="Como foi resolvido, encaminhamentos..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Responsável pelo Registro *
          </label>
          <input
            type="text"
            value={formData.responsavel}
            onChange={(e) => handleInputChange('responsavel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Nome do profissional que registrou"
            required
          />
        </div>

        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Save size={16} className="mr-2" />
            Salvar Evento
          </button>
        </div>
      </form>
    </>
  );
};