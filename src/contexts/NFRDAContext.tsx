import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, getCurrentUserId } from '../utils/supabase';
import { NFRDAEntry } from '../types';

interface NFRDAContextType {
  entries: NFRDAEntry[];
  addEntry: (entry: Omit<NFRDAEntry, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdate'>) => void;
  updateEntry: (id: string, entry: Partial<NFRDAEntry>) => void;
  deleteEntry: (id: string) => void;
  getEntry: (id: string) => NFRDAEntry | undefined;
  getPendingEntries: () => PendingEntry[];
}

interface PendingEntry {
  id: string;
  contractorName: string;
  unit: string;
  referenceMonth: number;
  referenceYear: number;
  deliveryStatus: string;
  paymentStatus: string;
  daysOverdue: number;
}

const NFRDAContext = createContext<NFRDAContextType | undefined>(undefined);

export const useNFRDA = () => {
  const context = useContext(NFRDAContext);
  if (context === undefined) {
    throw new Error('useNFRDA must be used within an NFRDAProvider');
  }
  return context;
};

interface NFRDAProviderProps {
  children: ReactNode;
}

export const NFRDAProvider: React.FC<NFRDAProviderProps> = ({ children }) => {
  const [entries, setEntries] = useState<NFRDAEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('nfrda_entries')
        .select('*')
        .order('reference_year', { ascending: false })
        .order('reference_month', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match our NFRDAEntry type
      const transformedEntries: NFRDAEntry[] = data.map(entry => ({
        id: entry.id,
        contractorId: entry.contractor_id,
        contractorName: entry.contractor_name,
        unit: entry.unit,
        referenceMonth: entry.reference_month,
        referenceYear: entry.reference_year,
        activityReportUpload: entry.activity_report_upload,
        invoiceUpload: entry.invoice_upload,
        deliveryStatus: entry.delivery_status,
        paymentStatus: entry.payment_status,
        paymentDate: entry.payment_date,
        lastUpdate: entry.last_update,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
      }));
      
      setEntries(transformedEntries);
    } catch (error) {
      console.error('Error fetching NFRDA entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (entryData: Omit<NFRDAEntry, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdate'>) => {
    try {
      const userId = await getCurrentUserId();

      const { data, error } = await supabase
        .from('nfrda_entries')
        .insert([{
          contractor_id: entryData.contractorId,
          contractor_name: entryData.contractorName,
          unit: entryData.unit,
          reference_month: entryData.referenceMonth,
          reference_year: entryData.referenceYear,
          activity_report_upload: entryData.activityReportUpload || null,
          invoice_upload: entryData.invoiceUpload || null,
          delivery_status: entryData.deliveryStatus,
          payment_status: entryData.paymentStatus,
          payment_date: entryData.paymentDate || null,
          created_by: userId,
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error adding NFRDA entry:', error);
        throw new Error(`Erro ao adicionar entrada: ${error.message}`);
      }

      console.log('NFRDA entry added successfully:', data);
      await fetchEntries();
    } catch (error) {
      console.error('Error adding NFRDA entry:', error);
      throw error;
    }
  };

  const updateEntry = async (id: string, entryData: Partial<NFRDAEntry>) => {
    try {
      const updateData: any = {};

      if (entryData.contractorId !== undefined) updateData.contractor_id = entryData.contractorId;
      if (entryData.contractorName !== undefined) updateData.contractor_name = entryData.contractorName;
      if (entryData.unit !== undefined) updateData.unit = entryData.unit;
      if (entryData.referenceMonth !== undefined) updateData.reference_month = entryData.referenceMonth;
      if (entryData.referenceYear !== undefined) updateData.reference_year = entryData.referenceYear;
      if (entryData.activityReportUpload !== undefined) updateData.activity_report_upload = entryData.activityReportUpload || null;
      if (entryData.invoiceUpload !== undefined) updateData.invoice_upload = entryData.invoiceUpload || null;
      if (entryData.deliveryStatus !== undefined) updateData.delivery_status = entryData.deliveryStatus;
      if (entryData.paymentStatus !== undefined) updateData.payment_status = entryData.paymentStatus;
      if (entryData.paymentDate !== undefined) updateData.payment_date = entryData.paymentDate || null;

      const { error } = await supabase
        .from('nfrda_entries')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Supabase error updating NFRDA entry:', error);
        throw new Error(`Erro ao atualizar entrada: ${error.message}`);
      }

      await fetchEntries();
    } catch (error) {
      console.error('Error updating NFRDA entry:', error);
      throw error;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('nfrda_entries')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchEntries();
    } catch (error) {
      console.error('Error deleting NFRDA entry:', error);
    }
  };

  const getEntry = (id: string) => {
    return entries.find(entry => entry.id === id);
  };

  const getPendingEntries = (): PendingEntry[] => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    return entries
      .filter(entry => {
        // Considerar pendente se não foi pago ou se status de entrega não é "Sim"
        return entry.paymentStatus !== 'Sim' || entry.deliveryStatus !== 'Sim';
      })
      .map(entry => {
        // Calcular dias de atraso baseado no mês de referência
        const entryDate = new Date(entry.referenceYear, entry.referenceMonth - 1, 15); // meio do mês
        const diffTime = today.getTime() - entryDate.getTime();
        const daysOverdue = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        
        return {
          id: entry.id,
          contractorName: entry.contractorName,
          unit: entry.unit,
          referenceMonth: entry.referenceMonth,
          referenceYear: entry.referenceYear,
          deliveryStatus: entry.deliveryStatus,
          paymentStatus: entry.paymentStatus,
          daysOverdue,
        };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  };

  const value = {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntry,
    getPendingEntries,
  };

  return <NFRDAContext.Provider value={value}>{children}</NFRDAContext.Provider>;
};