import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { GuestFinancialRecord, FinancialAdjustment, MonthlyRevenue, MonthlyPayment } from '../types/financial';
import { useAuth } from './AuthContext';

interface FinancialContextData {
  financialRecords: GuestFinancialRecord[];
  adjustments: FinancialAdjustment[];
  monthlyPayments: MonthlyPayment[];
  loading: boolean;
  createFinancialRecord: (record: Omit<GuestFinancialRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFinancialRecord: (id: string, updates: Partial<GuestFinancialRecord>) => Promise<void>;
  deleteFinancialRecord: (id: string) => Promise<void>;
  createAdjustment: (adjustment: Omit<FinancialAdjustment, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  getAdjustmentHistory: (guestId: string) => FinancialAdjustment[];
  getMonthlyRevenue: (year?: number) => MonthlyRevenue[];
  getAnnualRevenue: () => number;
  inactivateGuestFinancial: (guestId: string) => Promise<void>;
  getTotalMonthlyRevenue: () => number;
  recordMonthlyPayment: (guestId: string, month: string, paid: boolean, expectedAmount: number, amountPaid?: number, paymentDate?: string, paymentNotes?: string, notes?: string) => Promise<void>;
  getMonthlyPayments: (guestId: string) => MonthlyPayment[];
  getPaymentStatus: (guestId: string, month: string) => MonthlyPayment | undefined;
  getFinancialRecord: (guestId: string) => GuestFinancialRecord | undefined;
}

const FinancialContext = createContext<FinancialContextData | undefined>(undefined);

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [financialRecords, setFinancialRecords] = useState<GuestFinancialRecord[]>([]);
  const [adjustments, setAdjustments] = useState<FinancialAdjustment[]>([]);
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      const [recordsResult, adjustmentsResult, paymentsResult] = await Promise.all([
        supabase.from('guest_financial_records').select('*').order('created_at', { ascending: false }),
        supabase.from('financial_adjustments').select('*').order('adjustment_date', { ascending: false }),
        supabase.from('monthly_payments').select('*').order('payment_month', { ascending: false })
      ]);

      if (recordsResult.data) {
        setFinancialRecords(recordsResult.data.map(mapFinancialRecord));
      }

      if (adjustmentsResult.data) {
        setAdjustments(adjustmentsResult.data.map(mapAdjustment));
      }

      if (paymentsResult.data) {
        setMonthlyPayments(paymentsResult.data.map(mapMonthlyPayment));
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
    climatizationInstallments: record.climatization_installments || 1,
    climatizationStartMonth: record.climatization_start_month ? record.climatization_start_month.substring(0, 7) : undefined,
    climatizationSelectedMonths: Array.isArray(record.climatization_selected_months) ? record.climatization_selected_months : [],
    maintenanceFee: Number(record.maintenance_fee) || 0,
    maintenanceDueDay: record.maintenance_due_day,
    maintenanceInstallments: record.maintenance_installments || 1,
    maintenanceStartMonth: record.maintenance_start_month ? record.maintenance_start_month.substring(0, 7) : undefined,
    maintenanceSelectedMonths: Array.isArray(record.maintenance_selected_months) ? record.maintenance_selected_months : [],
    trousseauFee: Number(record.trousseau_fee) || 0,
    trousseauDueDay: record.trousseau_due_day,
    trousseauInstallments: record.trousseau_installments || 1,
    trousseauStartMonth: record.trousseau_start_month ? record.trousseau_start_month.substring(0, 7) : undefined,
    trousseauSelectedMonths: Array.isArray(record.trousseau_selected_months) ? record.trousseau_selected_months : [],
    thirteenthSalaryFee: Number(record.thirteenth_salary_fee) || 0,
    thirteenthSalaryDueDay: record.thirteenth_salary_due_day,
    thirteenthSalaryInstallments: record.thirteenth_salary_installments || 1,
    thirteenthSalaryStartMonth: record.thirteenth_salary_start_month ? record.thirteenth_salary_start_month.substring(0, 7) : undefined,
    thirteenthSalarySelectedMonths: Array.isArray(record.thirteenth_salary_selected_months) ? record.thirteenth_salary_selected_months : [],
    adjustedCurrentYear: record.adjusted_current_year || false,
    retroactiveAmount: Number(record.retroactive_amount) || 0,
    adjustmentYear: record.adjustment_year,
    outstandingBalance: Number(record.outstanding_balance) || 0,
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

  const mapMonthlyPayment = (payment: any): MonthlyPayment => ({
    id: payment.id,
    guestId: payment.guest_id,
    paymentMonth: payment.payment_month,
    expectedAmount: Number(payment.expected_amount) || 0,
    amountPaid: payment.amount_paid ? Number(payment.amount_paid) : undefined,
    amountDifference: Number(payment.amount_difference) || 0,
    hasDifference: payment.has_difference || false,
    monthlyFeePaid: payment.monthly_fee_paid,
    paymentDate: payment.payment_date,
    paymentNotes: payment.payment_notes,
    notes: payment.notes,
    createdAt: payment.created_at,
    updatedAt: payment.updated_at,
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
        climatization_installments: record.climatizationInstallments,
        climatization_start_month: record.climatizationStartMonth && record.climatizationStartMonth.trim() !== '' ? `${record.climatizationStartMonth}-01` : null,
        climatization_selected_months: record.climatizationSelectedMonths || [],
        maintenance_fee: record.maintenanceFee,
        maintenance_due_day: record.maintenanceDueDay,
        maintenance_installments: record.maintenanceInstallments,
        maintenance_start_month: record.maintenanceStartMonth && record.maintenanceStartMonth.trim() !== '' ? `${record.maintenanceStartMonth}-01` : null,
        maintenance_selected_months: record.maintenanceSelectedMonths || [],
        trousseau_fee: record.trousseauFee,
        trousseau_due_day: record.trousseauDueDay,
        trousseau_installments: record.trousseauInstallments,
        trousseau_start_month: record.trousseauStartMonth && record.trousseauStartMonth.trim() !== '' ? `${record.trousseauStartMonth}-01` : null,
        trousseau_selected_months: record.trousseauSelectedMonths || [],
        thirteenth_salary_fee: record.thirteenthSalaryFee,
        thirteenth_salary_due_day: record.thirteenthSalaryDueDay,
        thirteenth_salary_installments: record.thirteenthSalaryInstallments,
        thirteenth_salary_start_month: record.thirteenthSalaryStartMonth && record.thirteenthSalaryStartMonth.trim() !== '' ? `${record.thirteenthSalaryStartMonth}-01` : null,
        thirteenth_salary_selected_months: record.thirteenthSalarySelectedMonths || [],
        adjusted_current_year: record.adjustedCurrentYear,
        retroactive_amount: record.retroactiveAmount,
        adjustment_year: record.adjustmentYear || null,
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
    if (updates.climatizationInstallments !== undefined) updateData.climatization_installments = updates.climatizationInstallments;
    if (updates.climatizationStartMonth !== undefined) updateData.climatization_start_month = updates.climatizationStartMonth && updates.climatizationStartMonth.trim() !== '' ? `${updates.climatizationStartMonth}-01` : null;
    if (updates.climatizationSelectedMonths !== undefined) updateData.climatization_selected_months = updates.climatizationSelectedMonths;
    if (updates.maintenanceFee !== undefined) updateData.maintenance_fee = updates.maintenanceFee;
    if (updates.maintenanceDueDay !== undefined) updateData.maintenance_due_day = updates.maintenanceDueDay;
    if (updates.maintenanceInstallments !== undefined) updateData.maintenance_installments = updates.maintenanceInstallments;
    if (updates.maintenanceStartMonth !== undefined) updateData.maintenance_start_month = updates.maintenanceStartMonth && updates.maintenanceStartMonth.trim() !== '' ? `${updates.maintenanceStartMonth}-01` : null;
    if (updates.maintenanceSelectedMonths !== undefined) updateData.maintenance_selected_months = updates.maintenanceSelectedMonths;
    if (updates.trousseauFee !== undefined) updateData.trousseau_fee = updates.trousseauFee;
    if (updates.trousseauDueDay !== undefined) updateData.trousseau_due_day = updates.trousseauDueDay;
    if (updates.trousseauInstallments !== undefined) updateData.trousseau_installments = updates.trousseauInstallments;
    if (updates.trousseauStartMonth !== undefined) updateData.trousseau_start_month = updates.trousseauStartMonth && updates.trousseauStartMonth.trim() !== '' ? `${updates.trousseauStartMonth}-01` : null;
    if (updates.trousseauSelectedMonths !== undefined) updateData.trousseau_selected_months = updates.trousseauSelectedMonths;
    if (updates.thirteenthSalaryFee !== undefined) updateData.thirteenth_salary_fee = updates.thirteenthSalaryFee;
    if (updates.thirteenthSalaryDueDay !== undefined) updateData.thirteenth_salary_due_day = updates.thirteenthSalaryDueDay;
    if (updates.thirteenthSalaryInstallments !== undefined) updateData.thirteenth_salary_installments = updates.thirteenthSalaryInstallments;
    if (updates.thirteenthSalaryStartMonth !== undefined) updateData.thirteenth_salary_start_month = updates.thirteenthSalaryStartMonth && updates.thirteenthSalaryStartMonth.trim() !== '' ? `${updates.thirteenthSalaryStartMonth}-01` : null;
    if (updates.thirteenthSalarySelectedMonths !== undefined) updateData.thirteenth_salary_selected_months = updates.thirteenthSalarySelectedMonths;
    if (updates.adjustedCurrentYear !== undefined) updateData.adjusted_current_year = updates.adjustedCurrentYear;
    if (updates.retroactiveAmount !== undefined) updateData.retroactive_amount = updates.retroactiveAmount;
    if (updates.adjustmentYear !== undefined) updateData.adjustment_year = updates.adjustmentYear;
    if (updates.outstandingBalance !== undefined) updateData.outstanding_balance = updates.outstandingBalance;
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

  const isMonthInInstallmentPeriod = (currentMonth: string, startMonth: string, installments: number): boolean => {
    const [startYear, startMonthNum] = startMonth.split('-').map(Number);
    const [currentYear, currentMonthNum] = currentMonth.split('-').map(Number);

    const startMonthIndex = startYear * 12 + startMonthNum;
    const currentMonthIndex = currentYear * 12 + currentMonthNum;
    const endMonthIndex = startMonthIndex + installments - 1;

    return currentMonthIndex >= startMonthIndex && currentMonthIndex <= endMonthIndex;
  };

  const getMonthlyRevenue = (year: number = 2026): MonthlyRevenue[] => {
    const months: MonthlyRevenue[] = [];

    for (let month = 1; month <= 12; month++) {
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;

      const activeRecords = financialRecords.filter(r => r.isActive);
      const revenue = activeRecords.reduce((sum, r) => {
        let total = r.monthlyFee;

        // Climatização: prioriza meses selecionados, senão usa cálculo sequencial
        if (r.climatizationSelectedMonths && r.climatizationSelectedMonths.length > 0) {
          if (r.climatizationSelectedMonths.includes(monthKey)) {
            total += r.climatizationFee;
          }
        } else if (r.climatizationStartMonth && isMonthInInstallmentPeriod(monthKey, r.climatizationStartMonth, r.climatizationInstallments)) {
          total += r.climatizationFee;
        }

        // Manutenção: prioriza meses selecionados, senão usa cálculo sequencial
        if (r.maintenanceSelectedMonths && r.maintenanceSelectedMonths.length > 0) {
          if (r.maintenanceSelectedMonths.includes(monthKey)) {
            total += r.maintenanceFee;
          }
        } else if (r.maintenanceStartMonth && isMonthInInstallmentPeriod(monthKey, r.maintenanceStartMonth, r.maintenanceInstallments)) {
          total += r.maintenanceFee;
        }

        // Enxoval: prioriza meses selecionados, senão usa cálculo sequencial
        if (r.trousseauSelectedMonths && r.trousseauSelectedMonths.length > 0) {
          if (r.trousseauSelectedMonths.includes(monthKey)) {
            total += r.trousseauFee;
          }
        } else if (r.trousseauStartMonth && isMonthInInstallmentPeriod(monthKey, r.trousseauStartMonth, r.trousseauInstallments)) {
          total += r.trousseauFee;
        }

        // Décimo Terceiro: prioriza meses selecionados, senão usa cálculo sequencial
        if (r.thirteenthSalarySelectedMonths && r.thirteenthSalarySelectedMonths.length > 0) {
          if (r.thirteenthSalarySelectedMonths.includes(monthKey)) {
            total += r.thirteenthSalaryFee;
          }
        } else if (r.thirteenthSalaryStartMonth && isMonthInInstallmentPeriod(monthKey, r.thirteenthSalaryStartMonth, r.thirteenthSalaryInstallments)) {
          total += r.thirteenthSalaryFee;
        }

        if (month === 2 && r.adjustedCurrentYear && year === r.adjustmentYear) {
          total += r.retroactiveAmount;
        }

        return sum + total;
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

  const recordMonthlyPayment = async (
    guestId: string,
    month: string,
    paid: boolean,
    expectedAmount: number,
    amountPaid?: number,
    paymentDate?: string,
    paymentNotes?: string,
    notes?: string
  ) => {
    const existingPayment = monthlyPayments.find(
      p => p.guestId === guestId && p.paymentMonth === month
    );

    const actualAmountPaid = amountPaid ?? (paid ? expectedAmount : 0);
    const difference = expectedAmount - actualAmountPaid;
    const hasDiff = Math.abs(difference) > 0.01;

    const paymentData = {
      monthly_fee_paid: paid,
      expected_amount: expectedAmount,
      amount_paid: actualAmountPaid > 0 ? actualAmountPaid : null,
      amount_difference: difference,
      has_difference: hasDiff,
      payment_date: paymentDate || null,
      payment_notes: paymentNotes || null,
      notes: notes || '',
    };

    if (existingPayment) {
      const { data, error } = await supabase
        .from('monthly_payments')
        .update(paymentData)
        .eq('id', existingPayment.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMonthlyPayments(monthlyPayments.map(p =>
          p.id === existingPayment.id ? mapMonthlyPayment(data) : p
        ));

        if (hasDiff) {
          await updateOutstandingBalance(guestId);
        }
      }
    } else {
      const { data, error } = await supabase
        .from('monthly_payments')
        .insert({
          guest_id: guestId,
          payment_month: month,
          ...paymentData,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMonthlyPayments([...monthlyPayments, mapMonthlyPayment(data)]);

        if (hasDiff) {
          await updateOutstandingBalance(guestId);
        }
      }
    }
  };

  const updateOutstandingBalance = async (guestId: string) => {
    const guestPayments = monthlyPayments.filter(p => p.guestId === guestId);
    const totalOutstanding = guestPayments.reduce((sum, p) => sum + (p.amountDifference || 0), 0);

    const record = financialRecords.find(r => r.guestId === guestId);
    if (record) {
      await updateFinancialRecord(record.id, { outstandingBalance: totalOutstanding });
    }
  };

  const getMonthlyPayments = (guestId: string): MonthlyPayment[] => {
    return monthlyPayments.filter(p => p.guestId === guestId);
  };

  const getPaymentStatus = (guestId: string, month: string): MonthlyPayment | undefined => {
    return monthlyPayments.find(p => p.guestId === guestId && p.paymentMonth === month);
  };

  const getFinancialRecord = (guestId: string): GuestFinancialRecord | undefined => {
    return financialRecords.find(r => r.guestId === guestId);
  };

  return (
    <FinancialContext.Provider
      value={{
        financialRecords,
        adjustments,
        monthlyPayments,
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
        recordMonthlyPayment,
        getMonthlyPayments,
        getPaymentStatus,
        getFinancialRecord,
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
