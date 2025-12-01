import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';
import {
  LaborAgreement,
  LaborAgreementInstallment,
  LaborAgreementWithInstallments,
  LaborAgreementStatistics,
  LaborAgreementContextType,
} from '../types';

const LaborAgreementContext = createContext<LaborAgreementContextType | undefined>(undefined);

export const LaborAgreementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [agreements, setAgreements] = useState<LaborAgreementWithInstallments[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgreements = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data: agreementsData, error: agreementsError } = await supabase
        .from('labor_agreements')
        .select('*')
        .order('created_at', { ascending: false });

      if (agreementsError) throw agreementsError;

      const { data: installmentsData, error: installmentsError } = await supabase
        .from('labor_agreement_installments')
        .select('*')
        .order('installment_number', { ascending: true });

      if (installmentsError) throw installmentsError;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const updatedInstallments = installmentsData.map(installment => {
        const dueDate = new Date(installment.due_date);
        dueDate.setHours(0, 0, 0, 0);

        if (installment.payment_status === 'pending' && dueDate < today) {
          return { ...installment, payment_status: 'overdue' as const };
        }
        return installment;
      });

      const agreementsWithInstallments = agreementsData.map(agreement => ({
        id: agreement.id,
        claimantName: agreement.claimant_name,
        companyName: agreement.company_name,
        lawyerFullName: agreement.lawyer_full_name,
        pixKey: agreement.pix_key,
        processNumber: agreement.process_number,
        laborCourt: agreement.labor_court,
        jurisdiction: agreement.jurisdiction,
        totalAmount: parseFloat(agreement.total_amount),
        installmentCount: agreement.installment_count,
        notes: agreement.notes,
        createdBy: agreement.created_by,
        createdAt: agreement.created_at,
        updatedAt: agreement.updated_at,
        installments: updatedInstallments
          .filter(inst => inst.agreement_id === agreement.id)
          .map(inst => ({
            id: inst.id,
            agreementId: inst.agreement_id,
            installmentNumber: inst.installment_number,
            amount: parseFloat(inst.amount),
            dueDate: inst.due_date,
            paymentStatus: inst.payment_status,
            paymentDate: inst.payment_date,
            paymentProof: inst.payment_proof,
            createdAt: inst.created_at,
            updatedAt: inst.updated_at,
          })),
      }));

      setAgreements(agreementsWithInstallments);
    } catch (err: any) {
      console.error('Error fetching labor agreements:', err);
      setError(err.message || 'Erro ao carregar acordos trabalhistas');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchAgreementById = async (id: string): Promise<LaborAgreementWithInstallments | null> => {
    try {
      const { data: agreementData, error: agreementError } = await supabase
        .from('labor_agreements')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (agreementError) throw agreementError;
      if (!agreementData) return null;

      const { data: installmentsData, error: installmentsError } = await supabase
        .from('labor_agreement_installments')
        .select('*')
        .eq('agreement_id', id)
        .order('installment_number', { ascending: true });

      if (installmentsError) throw installmentsError;

      return {
        id: agreementData.id,
        claimantName: agreementData.claimant_name,
        companyName: agreementData.company_name,
        lawyerFullName: agreementData.lawyer_full_name,
        pixKey: agreementData.pix_key,
        processNumber: agreementData.process_number,
        laborCourt: agreementData.labor_court,
        jurisdiction: agreementData.jurisdiction,
        totalAmount: parseFloat(agreementData.total_amount),
        installmentCount: agreementData.installment_count,
        notes: agreementData.notes,
        createdBy: agreementData.created_by,
        createdAt: agreementData.created_at,
        updatedAt: agreementData.updated_at,
        installments: installmentsData.map(inst => ({
          id: inst.id,
          agreementId: inst.agreement_id,
          installmentNumber: inst.installment_number,
          amount: parseFloat(inst.amount),
          dueDate: inst.due_date,
          paymentStatus: inst.payment_status,
          paymentDate: inst.payment_date,
          paymentProof: inst.payment_proof,
          createdAt: inst.created_at,
          updatedAt: inst.updated_at,
        })),
      };
    } catch (err: any) {
      console.error('Error fetching agreement:', err);
      return null;
    }
  };

  const addAgreement = async (
    agreement: Omit<LaborAgreement, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>,
    installments: Omit<LaborAgreementInstallment, 'id' | 'agreementId' | 'createdAt' | 'updatedAt'>[]
  ) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data: agreementData, error: agreementError } = await supabase
        .from('labor_agreements')
        .insert({
          claimant_name: agreement.claimantName,
          company_name: agreement.companyName,
          lawyer_full_name: agreement.lawyerFullName,
          pix_key: agreement.pixKey,
          process_number: agreement.processNumber,
          labor_court: agreement.laborCourt,
          jurisdiction: agreement.jurisdiction,
          total_amount: agreement.totalAmount,
          installment_count: agreement.installmentCount,
          notes: agreement.notes,
          created_by: user.id,
        })
        .select()
        .single();

      if (agreementError) throw agreementError;

      const installmentsToInsert = installments.map(inst => ({
        agreement_id: agreementData.id,
        installment_number: inst.installmentNumber,
        amount: inst.amount,
        due_date: inst.dueDate,
        payment_status: inst.paymentStatus,
      }));

      const { error: installmentsError } = await supabase
        .from('labor_agreement_installments')
        .insert(installmentsToInsert);

      if (installmentsError) throw installmentsError;

      await fetchAgreements();
    } catch (err: any) {
      console.error('Error adding agreement:', err);
      throw err;
    }
  };

  const updateAgreement = async (id: string, agreement: Partial<LaborAgreement>) => {
    try {
      const updateData: any = {};

      if (agreement.claimantName !== undefined) updateData.claimant_name = agreement.claimantName;
      if (agreement.companyName !== undefined) updateData.company_name = agreement.companyName;
      if (agreement.lawyerFullName !== undefined) updateData.lawyer_full_name = agreement.lawyerFullName;
      if (agreement.pixKey !== undefined) updateData.pix_key = agreement.pixKey;
      if (agreement.processNumber !== undefined) updateData.process_number = agreement.processNumber;
      if (agreement.laborCourt !== undefined) updateData.labor_court = agreement.laborCourt;
      if (agreement.jurisdiction !== undefined) updateData.jurisdiction = agreement.jurisdiction;
      if (agreement.notes !== undefined) updateData.notes = agreement.notes;

      const { error } = await supabase
        .from('labor_agreements')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await fetchAgreements();
    } catch (err: any) {
      console.error('Error updating agreement:', err);
      throw err;
    }
  };

  const deleteAgreement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('labor_agreements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchAgreements();
    } catch (err: any) {
      console.error('Error deleting agreement:', err);
      throw err;
    }
  };

  const updateInstallment = async (id: string, installment: Partial<LaborAgreementInstallment>) => {
    try {
      const updateData: any = {};

      if (installment.amount !== undefined) updateData.amount = installment.amount;
      if (installment.dueDate !== undefined) updateData.due_date = installment.dueDate;
      if (installment.paymentStatus !== undefined) updateData.payment_status = installment.paymentStatus;
      if (installment.paymentDate !== undefined) updateData.payment_date = installment.paymentDate;
      if (installment.paymentProof !== undefined) updateData.payment_proof = installment.paymentProof;

      const { error } = await supabase
        .from('labor_agreement_installments')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await fetchAgreements();
    } catch (err: any) {
      console.error('Error updating installment:', err);
      throw err;
    }
  };

  const markInstallmentAsPaid = async (id: string, paymentDate: string, paymentProof?: string) => {
    try {
      const { error } = await supabase
        .from('labor_agreement_installments')
        .update({
          payment_status: 'paid',
          payment_date: paymentDate,
          payment_proof: paymentProof || null,
        })
        .eq('id', id);

      if (error) throw error;

      await fetchAgreements();
    } catch (err: any) {
      console.error('Error marking installment as paid:', err);
      throw err;
    }
  };

  const getUpcomingInstallments = (days: number = 7): LaborAgreementInstallment[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    const upcoming: LaborAgreementInstallment[] = [];

    agreements.forEach(agreement => {
      agreement.installments.forEach(installment => {
        if (installment.paymentStatus === 'pending') {
          const dueDate = new Date(installment.dueDate);
          dueDate.setHours(0, 0, 0, 0);

          if (dueDate >= today && dueDate <= futureDate) {
            upcoming.push(installment);
          }
        }
      });
    });

    return upcoming.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  };

  const getOverdueInstallments = (): LaborAgreementInstallment[] => {
    const overdue: LaborAgreementInstallment[] = [];

    agreements.forEach(agreement => {
      agreement.installments.forEach(installment => {
        if (installment.paymentStatus === 'overdue') {
          overdue.push(installment);
        }
      });
    });

    return overdue.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  };

  const getStatistics = (): LaborAgreementStatistics => {
    let totalPendingAmount = 0;
    let totalPaidAmount = 0;
    let overdueCount = 0;
    const upcomingCount = getUpcomingInstallments(7).length;

    agreements.forEach(agreement => {
      agreement.installments.forEach(installment => {
        if (installment.paymentStatus === 'paid') {
          totalPaidAmount += installment.amount;
        } else if (installment.paymentStatus === 'pending') {
          totalPendingAmount += installment.amount;
        } else if (installment.paymentStatus === 'overdue') {
          totalPendingAmount += installment.amount;
          overdueCount++;
        }
      });
    });

    return {
      totalAgreements: agreements.length,
      totalPendingAmount,
      totalPaidAmount,
      overdueInstallments: overdueCount,
      upcomingInstallments: upcomingCount,
    };
  };

  React.useEffect(() => {
    if (user) {
      fetchAgreements();
    }
  }, [user, fetchAgreements]);

  const value: LaborAgreementContextType = {
    agreements,
    loading,
    error,
    fetchAgreements,
    fetchAgreementById,
    addAgreement,
    updateAgreement,
    deleteAgreement,
    updateInstallment,
    markInstallmentAsPaid,
    getUpcomingInstallments,
    getOverdueInstallments,
    getStatistics,
  };

  return (
    <LaborAgreementContext.Provider value={value}>
      {children}
    </LaborAgreementContext.Provider>
  );
};

export const useLaborAgreements = () => {
  const context = useContext(LaborAgreementContext);
  if (!context) {
    throw new Error('useLaborAgreements must be used within a LaborAgreementProvider');
  }
  return context;
};
