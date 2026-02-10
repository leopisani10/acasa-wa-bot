import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { GuestFinancialRecord, FinancialAdjustment, MonthlyRevenue } from '../types/financial';
import { useAuth } from './AuthContext';

interface FinancialContextData {
  financialRecords: GuestFinancialRecord[];
  adjustments: FinancialAdjustment[];
  loading: boolean;
  createFinancialRecord: (record: Omit<GuestFinancialRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFinancialRecord: (id: string, updates: Partial<GuestFinancialRecord>) => Promise<void>;
  deleteFinancialRecord: (id: string) => Promise<void>;
  createAdjustment: (adjustment: Omit<FinancialAdjustment, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  getAdjustmentHistory: (guestId: string) => FinancialAdjustment[];
  getMonthlyRevenue: () => MonthlyRevenue[];
  getAnnualRevenue: () => number;
  inactivateGuestFinancial: (guestId: string) => Promise<void>;
  getTotalMonthlyRevenue: () => number;
}

const FinancialContext = createContext<FinancialContextData | undefined>(undefined);

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [financialRecords, setFinancialRecords] = useState<GuestFinancialRecord[]>([]);
  const [adjustments, setAdjustments] = useState<FinancialAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      const [recordsResult, adjustmentsResult] = await Promise.all([
        supabase.from('guest_financial_records').select('*').order('created_at', { ascending: false }),
        supabase.from('financial_adjustments').select('*').order('adjustment_date', { ascending: false })
      ]);

      if (recordsResult.data) {
        setFinancialRecords(recordsResult.data.map(mapFinancialRecord));
      }

      if (adjustmentsResult.data) {
        setAdjustments(adjustmentsResult.data.map(mapAdjustment));
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const mapFinancialRecord = (record: any): GuestFinancialRecord => ({
    id: record.id,
    guestId: record.guest_id,
    monthlyFee: Number(record.monthly_fee) || 0,
    monthlyDueDay: record.monthly_due_day,
    climatizationFee: Number(record.climatization_fee) || 0,
    climatizationDueDay: record.climatization_due_day,
    maintenanceFee: Number(record.maintenance_fee) || 0,
    maintenanceDueDay: record.maintenance_due_day,
    trousseauFee: Number(record.trousseau_fee) || 0,
    trousseauDueDay: record.trousseau_due_day,
    thirteenthSalaryFee: Number(record.thirteenth_salary_fee) || 0,
    thirteenthSalaryDueDay: record.thirteenth_salary_due_day,
    isActive: record.is_active,
    inactivationDate: record.inactivation_date,
    revenueLoss: Number(record.revenue_loss) || 0,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  });

  const mapAdjustment = (adjustment: any): FinancialAdjustment => ({
    id: adjustment.id,
    guestId: adjustment.guest_id,
    adjustmentDate: adjustment.adjustment_date,
    previousMonthlyFee: Number(adjustment.previous_monthly_fee) || 0,
    newMonthlyFee: Number(adjustment.new_monthly_fee) || 0,
    adjustmentPercentage: Number(adjustment.adjustment_percentage) || 0,
    notes: adjustment.notes,
    createdAt: adjustment.created_at,
    createdBy: adjustment.created_by,
  });

  const createFinancialRecord = async (record: Omit<GuestFinancialRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('guest_financial_records')
      .insert({
        guest_id: record.guestId,
        monthly_fee: record.monthlyFee,
        monthly_due_day: record.monthlyDueDay,
        climatization_fee: record.climatizationFee,
        climatization_due_day: record.climatizationDueDay,
        maintenance_fee: record.maintenanceFee,
        maintenance_due_day: record.maintenanceDueDay,
        trousseau_fee: record.trousseauFee,
        trousseau_due_day: record.trousseauDueDay,
        thirteenth_salary_fee: record.thirteenthSalaryFee,
        thirteenth_salary_due_day: record.thirteenthSalaryDueDay,
        is_active: record.isActive,
        revenue_loss: record.revenueLoss,
      })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setFinancialRecords([...financialRecords, mapFinancialRecord(data)]);
    }
  };

  const updateFinancialRecord = async (id: string, updates: Partial<GuestFinancialRecord>) => {
    const updateData: any = {};

    if (updates.monthlyFee !== undefined) updateData.monthly_fee = updates.monthlyFee;
    if (updates.monthlyDueDay !== undefined) updateData.monthly_due_day = updates.monthlyDueDay;
    if (updates.climatizationFee !== undefined) updateData.climatization_fee = updates.climatizationFee;
    if (updates.climatizationDueDay !== undefined) updateData.climatization_due_day = updates.climatizationDueDay;
    if (updates.maintenanceFee !== undefined) updateData.maintenance_fee = updates.maintenanceFee;
    if (updates.maintenanceDueDay !== undefined) updateData.maintenance_due_day = updates.maintenanceDueDay;
    if (updates.trousseauFee !== undefined) updateData.trousseau_fee = updates.trousseauFee;
    if (updates.trousseauDueDay !== undefined) updateData.trousseau_due_day = updates.trousseauDueDay;
    if (updates.thirteenthSalaryFee !== undefined) updateData.thirteenth_salary_fee = updates.thirteenthSalaryFee;
    if (updates.thirteenthSalaryDueDay !== undefined) updateData.thirteenth_salary_due_day = updates.thirteenthSalaryDueDay;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.inactivationDate !== undefined) updateData.inactivation_date = updates.inactivationDate;
    if (updates.revenueLoss !== undefined) updateData.revenue_loss = updates.revenueLoss;

    const { data, error } = await supabase
      .from('guest_financial_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setFinancialRecords(financialRecords.map(r => r.id === id ? mapFinancialRecord(data) : r));
    }
  };

  const deleteFinancialRecord = async (id: string) => {
    const { error } = await supabase
      .from('guest_financial_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setFinancialRecords(financialRecords.filter(r => r.id !== id));
  };

  const createAdjustment = async (adjustment: Omit<FinancialAdjustment, 'id' | 'createdAt' | 'createdBy'>) => {
    const { data, error } = await supabase
      .from('financial_adjustments')
      .insert({
        guest_id: adjustment.guestId,
        adjustment_date: adjustment.adjustmentDate,
        previous_monthly_fee: adjustment.previousMonthlyFee,
        new_monthly_fee: adjustment.newMonthlyFee,
        adjustment_percentage: adjustment.adjustmentPercentage,
        notes: adjustment.notes,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setAdjustments([mapAdjustment(data), ...adjustments]);
    }
  };

  const getAdjustmentHistory = (guestId: string): FinancialAdjustment[] => {
    return adjustments.filter(a => a.guestId === guestId);
  };

  const getTotalMonthlyRevenue = (): number => {
    return financialRecords
      .filter(r => r.isActive)
      .reduce((sum, r) => {
        return sum + r.monthlyFee + r.climatizationFee + r.maintenanceFee + r.trousseauFee;
      }, 0);
  };

  const getMonthlyRevenue = (): MonthlyRevenue[] => {
    const months: MonthlyRevenue[] = [];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const activeRecords = financialRecords.filter(r => r.isActive);
      const revenue = activeRecords.reduce((sum, r) => {
        return sum + r.monthlyFee + r.climatizationFee + r.maintenanceFee + r.trousseauFee;
      }, 0);

      const inactiveInMonth = financialRecords.filter(r => {
        if (!r.inactivationDate) return false;
        const inactivationMonth = r.inactivationDate.substring(0, 7);
        return inactivationMonth === monthKey;
      });

      const revenueLoss = inactiveInMonth.reduce((sum, r) => sum + r.revenueLoss, 0);

      months.push({
        month: monthKey,
        revenue: revenue,
        activeGuests: activeRecords.length,
        inactiveGuests: inactiveInMonth.length,
        revenueLoss: revenueLoss,
        netRevenue: revenue - revenueLoss,
      });
    }

    for (let i = 1; i <= 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const activeRecords = financialRecords.filter(r => r.isActive);
      const projectedRevenue = activeRecords.reduce((sum, r) => {
        return sum + r.monthlyFee + r.climatizationFee + r.maintenanceFee + r.trousseauFee;
      }, 0);

      months.push({
        month: monthKey,
        revenue: projectedRevenue,
        activeGuests: activeRecords.length,
        inactiveGuests: 0,
        revenueLoss: 0,
        netRevenue: projectedRevenue,
      });
    }

    return months;
  };

  const getAnnualRevenue = (): number => {
    const monthlyTotal = getTotalMonthlyRevenue();
    const thirteenthTotal = financialRecords
      .filter(r => r.isActive)
      .reduce((sum, r) => sum + r.thirteenthSalaryFee, 0);

    return (monthlyTotal * 12) + thirteenthTotal;
  };

  const inactivateGuestFinancial = async (guestId: string) => {
    const record = financialRecords.find(r => r.guestId === guestId);
    if (!record) return;

    const totalLoss = record.monthlyFee + record.climatizationFee + record.maintenanceFee + record.trousseauFee;

    await updateFinancialRecord(record.id, {
      isActive: false,
      inactivationDate: new Date().toISOString().split('T')[0],
      revenueLoss: totalLoss,
    });
  };

  return (
    <FinancialContext.Provider
      value={{
        financialRecords,
        adjustments,
        loading,
        createFinancialRecord,
        updateFinancialRecord,
        deleteFinancialRecord,
        createAdjustment,
        getAdjustmentHistory,
        getMonthlyRevenue,
        getAnnualRevenue,
        inactivateGuestFinancial,
        getTotalMonthlyRevenue,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};
