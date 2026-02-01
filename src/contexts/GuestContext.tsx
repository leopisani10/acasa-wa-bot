import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, getCurrentUserId } from '../utils/supabase';
import { Guest } from '../types';

interface GuestContextType {
  guests: Guest[];
  addGuest: (guest: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGuest: (id: string, guest: Partial<Guest>) => void;
  deleteGuest: (id: string) => void;
  getGuest: (id: string) => Guest | undefined;
  loading: boolean;
  error: string | null;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export const useGuests = () => {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error('useGuests must be used within a GuestProvider');
  }
  return context;
};

interface GuestProviderProps {
  children: ReactNode;
}

export const GuestProvider: React.FC<GuestProviderProps> = ({ children }) => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select(`
          *,
          guest_vaccines(*)
        `)
        .order('full_name');
      
      if (error) throw error;
      
      // Transform data to match our Guest type
      const transformedGuests: Guest[] = data.map(guest => ({
        id: guest.id,
        fullName: guest.full_name,
        gender: guest.gender,
        birthDate: guest.birth_date,
        cpf: guest.cpf,
        rg: guest.rg,
        documentIssuer: guest.document_issuer,
        photo: guest.photo,
        hasCuratorship: guest.has_curatorship,
        imageUsageAuthorized: guest.image_usage_authorized,
        status: guest.status,
        stayType: guest.stay_type || 'Longa Permanência',
        admissionDate: guest.admission_date,
        exitDate: guest.exit_date,
        exitReason: guest.exit_reason,
        hasNewContract: guest.has_new_contract,
        contractExpiryDate: guest.contract_expiry_date,
        dependencyLevel: guest.dependency_level,
        legalResponsibleRelationship: guest.legal_responsible_relationship,
        legalResponsibleCpf: guest.legal_responsible_cpf,
        financialResponsibleName: guest.financial_responsible_name,
        financialResponsibleRg: guest.financial_responsible_rg,
        financialResponsibleCpf: guest.financial_responsible_cpf,
        financialResponsibleMaritalStatus: guest.financial_responsible_marital_status,
        financialResponsiblePhone: guest.financial_responsible_phone,
        financialResponsibleEmail: guest.financial_responsible_email || '',
        financialResponsibleAddress: guest.financial_responsible_address,
        financialResponsibleProfession: guest.financial_responsible_profession || '',
        unit: guest.unit,
        climatizationFee: guest.climatization_fee,
        maintenanceFee: guest.maintenance_fee,
        trousseauFee: guest.trousseau_fee,
        administrativeFee: guest.administrative_fee,
        roomNumber: guest.room_number,
        healthPlan: guest.health_plan || '',
        hasSpeechTherapy: guest.has_speech_therapy,
        pia: guest.pia || '',
        paisi: guest.paisi || '',
        digitalizedContract: guest.digitalized_contract || '',
        vaccinationUpToDate: guest.vaccination_up_to_date,
        vaccines: guest.guest_vaccines?.map((vaccine: any) => ({
          id: vaccine.id,
          type: vaccine.type,
          applicationDate: vaccine.application_date,
          notes: vaccine.notes || '',
        })) || [],
        createdAt: guest.created_at,
        updatedAt: guest.updated_at,
      }));
      
      setGuests(transformedGuests);
    } catch (error) {
      console.error('Error fetching guests:', error);
    } finally {
      setLoading(false);
    }
  };

  const addGuest = async (guestData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('GuestContext: Starting addGuest for:', guestData.fullName);
      const userId = await getCurrentUserId();
      console.log('GuestContext: Current user ID:', userId);
      
      console.log('GuestContext: Preparing database insert...');
      const { data, error } = await supabase
        .from('guests')
        .insert([{
          full_name: guestData.fullName,
          gender: guestData.gender,
          birth_date: guestData.birthDate || null,
          cpf: guestData.cpf,
          rg: guestData.rg,
          document_issuer: guestData.documentIssuer,
          photo: guestData.photo,
          has_curatorship: guestData.hasCuratorship,
          image_usage_authorized: guestData.imageUsageAuthorized,
          status: guestData.status,
          stay_type: guestData.stayType,
          admission_date: guestData.admissionDate || null,
          exit_date: guestData.exitDate || null,
          exit_reason: guestData.exitReason || null,
          has_new_contract: guestData.hasNewContract,
          contract_expiry_date: guestData.contractExpiryDate || null,
          dependency_level: guestData.dependencyLevel,
          legal_responsible_relationship: guestData.legalResponsibleRelationship,
          legal_responsible_cpf: guestData.legalResponsibleCpf,
          financial_responsible_name: guestData.financialResponsibleName,
          financial_responsible_rg: guestData.financialResponsibleRg,
          financial_responsible_cpf: guestData.financialResponsibleCpf,
          financial_responsible_marital_status: guestData.financialResponsibleMaritalStatus,
          financial_responsible_phone: guestData.financialResponsiblePhone,
          financial_responsible_email: guestData.financialResponsibleEmail,
          financial_responsible_address: guestData.financialResponsibleAddress,
          financial_responsible_profession: guestData.financialResponsibleProfession,
          unit: guestData.unit,
          climatization_fee: guestData.climatizationFee,
          maintenance_fee: guestData.maintenanceFee,
          trousseau_fee: guestData.trousseauFee,
          administrative_fee: guestData.administrativeFee,
          room_number: guestData.roomNumber,
          health_plan: guestData.healthPlan,
          has_speech_therapy: guestData.hasSpeechTherapy,
          pia: guestData.pia,
          paisi: guestData.paisi,
          digitalized_contract: guestData.digitalizedContract,
          vaccination_up_to_date: guestData.vaccinationUpToDate,
          created_by: userId,
        }])
        .select()
        .single();
      
      console.log('GuestContext: Database response:', { data, error });

      if (error) {
        console.error('GuestContext: Database error:', error);
        throw new Error(error.message || error.hint || 'Erro ao salvar no banco de dados');
      }
      
      console.log('GuestContext: Guest inserted successfully:', data);
      
      // Add vaccines if any
      if (guestData.vaccines.length > 0) {
        console.log('GuestContext: Adding vaccines...');
        const vaccineInserts = guestData.vaccines.map(vaccine => ({
          guest_id: data.id,
          type: vaccine.type,
          application_date: vaccine.applicationDate || null,
          notes: vaccine.notes,
        }));
        
        const { error: vaccineError } = await supabase.from('guest_vaccines').insert(vaccineInserts);
        if (vaccineError) {
          console.error('GuestContext: Error adding vaccines:', vaccineError);
          throw vaccineError;
        }
      }
      
      console.log('GuestContext: Calling fetchGuests to refresh list...');
      await fetchGuests();
      console.log('GuestContext: addGuest completed successfully');
    } catch (error) {
      console.error('Error adding guest:', error);
      // Re-throw the error so it can be caught by the import function
      throw error;
    }
  };

  const updateGuest = async (id: string, guestData: Partial<Guest>) => {
    try {
      const updateData: any = {};

      if (guestData.fullName !== undefined) updateData.full_name = guestData.fullName;
      if (guestData.gender !== undefined) updateData.gender = guestData.gender;
      if (guestData.birthDate !== undefined) updateData.birth_date = guestData.birthDate || null;
      if (guestData.cpf !== undefined) updateData.cpf = guestData.cpf;
      if (guestData.rg !== undefined) updateData.rg = guestData.rg;
      if (guestData.documentIssuer !== undefined) updateData.document_issuer = guestData.documentIssuer;
      if (guestData.photo !== undefined) updateData.photo = guestData.photo;
      if (guestData.hasCuratorship !== undefined) updateData.has_curatorship = guestData.hasCuratorship;
      if (guestData.imageUsageAuthorized !== undefined) updateData.image_usage_authorized = guestData.imageUsageAuthorized;
      if (guestData.status !== undefined) updateData.status = guestData.status;
      if (guestData.stayType !== undefined) updateData.stay_type = guestData.stayType;
      if (guestData.admissionDate !== undefined) updateData.admission_date = guestData.admissionDate || null;
      if (guestData.exitDate !== undefined) updateData.exit_date = guestData.exitDate || null;
      if (guestData.exitReason !== undefined) updateData.exit_reason = guestData.exitReason || null;
      if (guestData.hasNewContract !== undefined) updateData.has_new_contract = guestData.hasNewContract;
      if (guestData.contractExpiryDate !== undefined) updateData.contract_expiry_date = guestData.contractExpiryDate || null;
      if (guestData.dependencyLevel !== undefined) updateData.dependency_level = guestData.dependencyLevel;
      if (guestData.legalResponsibleRelationship !== undefined) updateData.legal_responsible_relationship = guestData.legalResponsibleRelationship;
      if (guestData.legalResponsibleCpf !== undefined) updateData.legal_responsible_cpf = guestData.legalResponsibleCpf;
      if (guestData.financialResponsibleName !== undefined) updateData.financial_responsible_name = guestData.financialResponsibleName;
      if (guestData.financialResponsibleRg !== undefined) updateData.financial_responsible_rg = guestData.financialResponsibleRg;
      if (guestData.financialResponsibleCpf !== undefined) updateData.financial_responsible_cpf = guestData.financialResponsibleCpf;
      if (guestData.financialResponsibleMaritalStatus !== undefined) updateData.financial_responsible_marital_status = guestData.financialResponsibleMaritalStatus;
      if (guestData.financialResponsiblePhone !== undefined) updateData.financial_responsible_phone = guestData.financialResponsiblePhone;
      if (guestData.financialResponsibleEmail !== undefined) updateData.financial_responsible_email = guestData.financialResponsibleEmail;
      if (guestData.financialResponsibleAddress !== undefined) updateData.financial_responsible_address = guestData.financialResponsibleAddress;
      if (guestData.financialResponsibleProfession !== undefined) updateData.financial_responsible_profession = guestData.financialResponsibleProfession;
      if (guestData.unit !== undefined) updateData.unit = guestData.unit;
      if (guestData.climatizationFee !== undefined) updateData.climatization_fee = guestData.climatizationFee;
      if (guestData.maintenanceFee !== undefined) updateData.maintenance_fee = guestData.maintenanceFee;
      if (guestData.trousseauFee !== undefined) updateData.trousseau_fee = guestData.trousseauFee;
      if (guestData.administrativeFee !== undefined) updateData.administrative_fee = guestData.administrativeFee;
      if (guestData.roomNumber !== undefined) updateData.room_number = guestData.roomNumber;
      if (guestData.healthPlan !== undefined) updateData.health_plan = guestData.healthPlan;
      if (guestData.hasSpeechTherapy !== undefined) updateData.has_speech_therapy = guestData.hasSpeechTherapy;
      if (guestData.pia !== undefined) updateData.pia = guestData.pia;
      if (guestData.paisi !== undefined) updateData.paisi = guestData.paisi;
      if (guestData.digitalizedContract !== undefined) updateData.digitalized_contract = guestData.digitalizedContract;
      if (guestData.vaccinationUpToDate !== undefined) updateData.vaccination_up_to_date = guestData.vaccinationUpToDate;

      const { error } = await supabase
        .from('guests')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('GuestContext: Update error:', error);
        throw new Error(error.message || error.hint || 'Erro ao atualizar no banco de dados');
      }

      // If guest is being inactivated, remove them from any bed they occupy
      if (guestData.status === 'Inativo') {
        const { error: bedError } = await supabase
          .from('beds')
          .update({ guest_id: null })
          .eq('guest_id', id);

        if (bedError) {
          console.error('Error removing guest from bed:', bedError);
        }
      }
      
      // Handle vaccines update if provided
      if (guestData.vaccines !== undefined) {
        // Delete existing vaccines
        await supabase.from('guest_vaccines').delete().eq('guest_id', id);
        
        // Insert new vaccines
        if (guestData.vaccines.length > 0) {
          const vaccineInserts = guestData.vaccines.map(vaccine => ({
            guest_id: id,
            type: vaccine.type,
            application_date: vaccine.applicationDate || null,
            notes: vaccine.notes,
          }));
          
          await supabase.from('guest_vaccines').insert(vaccineInserts);
        }
      }
      
      await fetchGuests();
    } catch (error) {
      console.error('Error updating guest:', error);
      throw error;
    }
  };

  const deleteGuest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('GuestContext: Delete error:', error);
        throw new Error(error.message || error.hint || 'Erro ao excluir do banco de dados');
      }

      await fetchGuests();
    } catch (error) {
      console.error('Error deleting guest:', error);
      throw error;
    }
  };

  const getGuest = (id: string) => {
    return guests.find(guest => guest.id === id);
  };

  const value = {
    guests,
    addGuest,
    updateGuest,
    deleteGuest,
    getGuest,
    loading,
    error,
  };

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
};