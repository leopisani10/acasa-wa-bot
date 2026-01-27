import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabase';
import { Room, RoomWithBeds, Bed, BedWithGuest, RoomContextType } from '../types';

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<RoomWithBeds[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .order('floor', { ascending: true })
        .order('room_number', { ascending: true });

      if (roomsError) throw roomsError;

      // Fetch beds with guests
      const { data: bedsData, error: bedsError } = await supabase
        .from('beds')
        .select(`
          *,
          guest:guests(*)
        `)
        .order('status', { ascending: false })
        .order('bed_number', { ascending: true });

      if (bedsError) throw bedsError;

      // Combine rooms with beds
      const roomsWithBeds: RoomWithBeds[] = (roomsData || []).map((room: any) => ({
        id: room.id,
        roomNumber: room.room_number,
        floor: room.floor,
        bedCount: room.bed_count,
        notes: room.notes || '',
        createdAt: room.created_at,
        updatedAt: room.updated_at,
        beds: (bedsData || [])
          .filter((bed: any) => bed.room_id === room.id)
          .map((bed: any) => ({
            id: bed.id,
            roomId: bed.room_id,
            bedNumber: bed.bed_number,
            guestId: bed.guest_id,
            status: bed.status || 'Ativa',
            inactiveReason: bed.inactive_reason,
            deactivatedAt: bed.deactivated_at,
            deactivatedBy: bed.deactivated_by,
            notes: bed.notes || '',
            createdAt: bed.created_at,
            updatedAt: bed.updated_at,
            guest: bed.guest ? {
              id: bed.guest.id,
              fullName: bed.guest.full_name,
              gender: bed.guest.gender,
              birthDate: bed.guest.birth_date,
              cpf: bed.guest.cpf,
              rg: bed.guest.rg,
              documentIssuer: bed.guest.document_issuer,
              photo: bed.guest.photo,
              hasCuratorship: bed.guest.has_curatorship,
              imageUsageAuthorized: bed.guest.image_usage_authorized,
              status: bed.guest.status,
              stayType: bed.guest.stay_type,
              admissionDate: bed.guest.admission_date,
              exitDate: bed.guest.exit_date,
              exitReason: bed.guest.exit_reason,
              hasNewContract: bed.guest.has_new_contract,
              contractExpiryDate: bed.guest.contract_expiry_date,
              dependencyLevel: bed.guest.dependency_level,
              legalResponsibleRelationship: bed.guest.legal_responsible_relationship,
              legalResponsibleCpf: bed.guest.legal_responsible_cpf,
              financialResponsibleName: bed.guest.financial_responsible_name,
              financialResponsibleRg: bed.guest.financial_responsible_rg,
              financialResponsibleCpf: bed.guest.financial_responsible_cpf,
              financialResponsibleMaritalStatus: bed.guest.financial_responsible_marital_status,
              financialResponsiblePhone: bed.guest.financial_responsible_phone,
              financialResponsibleEmail: bed.guest.financial_responsible_email,
              financialResponsibleAddress: bed.guest.financial_responsible_address,
              financialResponsibleProfession: bed.guest.financial_responsible_profession,
              unit: bed.guest.unit,
              climatizationFee: bed.guest.climatization_fee,
              maintenanceFee: bed.guest.maintenance_fee,
              trousseauFee: bed.guest.trousseau_fee,
              administrativeFee: bed.guest.administrative_fee,
              roomNumber: bed.guest.room_number,
              healthPlan: bed.guest.health_plan,
              hasSpeechTherapy: bed.guest.has_speech_therapy,
              pia: bed.guest.pia,
              paisi: bed.guest.paisi,
              digitalizedContract: bed.guest.digitalized_contract,
              vaccinationUpToDate: bed.guest.vaccination_up_to_date,
              vaccines: [],
              createdAt: bed.guest.created_at,
              updatedAt: bed.guest.updated_at,
            } : null,
          })),
      }));

      setRooms(roomsWithBeds);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const addRoom = async (room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);

      // Insert room
      const { data: newRoom, error: roomError } = await supabase
        .from('rooms')
        .insert([{
          room_number: room.roomNumber,
          floor: room.floor,
          bed_count: room.bedCount,
          notes: room.notes || '',
        }])
        .select()
        .single();

      if (roomError) throw roomError;

      // Create beds for the room
      const bedsToInsert = Array.from({ length: room.bedCount }, (_, i) => ({
        room_id: newRoom.id,
        bed_number: i + 1,
        guest_id: null,
        status: 'Ativa',
        notes: '',
      }));

      const { error: bedsError } = await supabase
        .from('beds')
        .insert(bedsToInsert);

      if (bedsError) throw bedsError;

      await fetchRooms();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateRoom = async (id: string, roomUpdate: Partial<Room>) => {
    try {
      setError(null);

      const updates: any = {};
      if (roomUpdate.roomNumber !== undefined) updates.room_number = roomUpdate.roomNumber;
      if (roomUpdate.floor !== undefined) updates.floor = roomUpdate.floor;
      if (roomUpdate.bedCount !== undefined) updates.bed_count = roomUpdate.bedCount;
      if (roomUpdate.notes !== undefined) updates.notes = roomUpdate.notes;

      const { error: updateError } = await supabase
        .from('rooms')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      // If room number changed, update all guests in this room
      if (roomUpdate.roomNumber !== undefined) {
        // Get all beds in this room with their guests
        const { data: bedsData, error: bedsError } = await supabase
          .from('beds')
          .select('guest_id')
          .eq('room_id', id)
          .not('guest_id', 'is', null);

        if (bedsError) throw bedsError;

        // Update room_number for all guests in this room
        if (bedsData && bedsData.length > 0) {
          const guestIds = bedsData.map(bed => bed.guest_id);
          const { error: updateGuestsError } = await supabase
            .from('guests')
            .update({ room_number: roomUpdate.roomNumber })
            .in('id', guestIds);

          if (updateGuestsError) throw updateGuestsError;
        }
      }

      // If bed count changed, adjust beds
      if (roomUpdate.bedCount !== undefined) {
        const room = rooms.find(r => r.id === id);
        if (room) {
          const currentBedCount = room.beds.length;
          const newBedCount = roomUpdate.bedCount;

          if (newBedCount > currentBedCount) {
            // Add new beds
            const bedsToAdd = Array.from({ length: newBedCount - currentBedCount }, (_, i) => ({
              room_id: id,
              bed_number: currentBedCount + i + 1,
              guest_id: null,
              notes: '',
            }));

            const { error: addBedsError } = await supabase
              .from('beds')
              .insert(bedsToAdd);

            if (addBedsError) throw addBedsError;
          } else if (newBedCount < currentBedCount) {
            // Remove excess beds (only empty ones)
            const bedsToRemove = room.beds
              .slice(newBedCount)
              .filter(bed => !bed.guestId)
              .map(bed => bed.id);

            if (bedsToRemove.length > 0) {
              const { error: removeBedsError } = await supabase
                .from('beds')
                .delete()
                .in('id', bedsToRemove);

              if (removeBedsError) throw removeBedsError;
            }
          }
        }
      }

      await fetchRooms();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteRoom = async (id: string) => {
    try {
      setError(null);

      // Check if room has occupied beds
      const room = rooms.find(r => r.id === id);
      if (room && room.beds.some(bed => bed.guestId)) {
        throw new Error('Não é possível excluir um quarto com camas ocupadas');
      }

      const { error: deleteError } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchRooms();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const allocateGuestToBed = async (bedId: string, guestId: string | null) => {
    try {
      setError(null);

      // Get bed info to find the room
      const { data: bedData, error: bedError } = await supabase
        .from('beds')
        .select('guest_id, room_id')
        .eq('id', bedId)
        .single();

      if (bedError) throw bedError;

      const previousGuestId = bedData.guest_id;

      // Get room info
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('room_number')
        .eq('id', bedData.room_id)
        .single();

      if (roomError) throw roomError;

      // If removing a guest from bed, clear their room_number
      if (previousGuestId && previousGuestId !== guestId) {
        const { error: clearGuestError } = await supabase
          .from('guests')
          .update({ room_number: '' })
          .eq('id', previousGuestId);

        if (clearGuestError) throw clearGuestError;
      }

      // Update the bed with new guest
      const { error: updateError } = await supabase
        .from('beds')
        .update({ guest_id: guestId })
        .eq('id', bedId);

      if (updateError) throw updateError;

      // If allocating a guest, update their room_number
      if (guestId) {
        const { error: updateGuestError } = await supabase
          .from('guests')
          .update({ room_number: roomData.room_number })
          .eq('id', guestId);

        if (updateGuestError) throw updateGuestError;
      }

      await fetchRooms();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateBed = async (bedId: string, updates: Partial<Bed>) => {
    try {
      setError(null);

      // If updating guest allocation, use the allocateGuestToBed function
      if (updates.guestId !== undefined) {
        await allocateGuestToBed(bedId, updates.guestId);
        return;
      }

      // Build update object
      const bedUpdates: any = {};
      if (updates.notes !== undefined) bedUpdates.notes = updates.notes;
      if (updates.status !== undefined) bedUpdates.status = updates.status;
      if (updates.inactiveReason !== undefined) bedUpdates.inactive_reason = updates.inactiveReason;
      if (updates.deactivatedAt !== undefined) bedUpdates.deactivated_at = updates.deactivatedAt;
      if (updates.deactivatedBy !== undefined) bedUpdates.deactivated_by = updates.deactivatedBy;

      const { error: updateError } = await supabase
        .from('beds')
        .update(bedUpdates)
        .eq('id', bedId);

      if (updateError) throw updateError;

      await fetchRooms();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getRoomsByFloor = (floor: number): RoomWithBeds[] => {
    return rooms.filter(room => room.floor === floor);
  };

  const getAvailableBeds = (): BedWithGuest[] => {
    return rooms.flatMap(room => room.beds.filter(bed => bed.status === 'Ativa' && !bed.guestId));
  };

  return (
    <RoomContext.Provider
      value={{
        rooms,
        loading,
        error,
        addRoom,
        updateRoom,
        deleteRoom,
        allocateGuestToBed,
        updateBed,
        getRoomsByFloor,
        getAvailableBeds,
        fetchRooms,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRooms = () => {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRooms must be used within a RoomProvider');
  }
  return context;
};
