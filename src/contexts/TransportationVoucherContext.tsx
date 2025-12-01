import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TransportationVoucher, TransportationVoucherContextType } from '../types';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';

const TransportationVoucherContext = createContext<TransportationVoucherContextType | undefined>(undefined);

export const useTransportationVouchers = () => {
  const context = useContext(TransportationVoucherContext);
  if (!context) {
    throw new Error('useTransportationVouchers must be used within TransportationVoucherProvider');
  }
  return context;
};

export const TransportationVoucherProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vouchers, setVouchers] = useState<TransportationVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchVouchers();
    }
  }, [user]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transportation_vouchers')
        .select(`
          *,
          employees (
            full_name
          )
        `)
        .order('reference_month', { ascending: false });

      if (error) throw error;

      const formattedVouchers: TransportationVoucher[] = data.map((voucher: any) => ({
        id: voucher.id,
        employeeId: voucher.employee_id,
        employeeName: voucher.employees?.full_name || '',
        referenceMonth: voucher.reference_month,
        dailyValue: parseFloat(voucher.daily_value),
        workingDays: voucher.working_days,
        totalValue: parseFloat(voucher.total_value),
        paymentDate: voucher.payment_date || '',
        paid: voucher.paid,
        notes: voucher.notes || '',
        createdBy: voucher.created_by,
        createdAt: voucher.created_at,
        updatedAt: voucher.updated_at,
      }));

      setVouchers(formattedVouchers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar vale transporte');
      console.error('Error fetching vouchers:', err);
    } finally {
      setLoading(false);
    }
  };

  const addVoucher = async (voucherData: Omit<TransportationVoucher, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('transportation_vouchers')
        .insert([{
          employee_id: voucherData.employeeId,
          reference_month: voucherData.referenceMonth,
          daily_value: voucherData.dailyValue,
          working_days: voucherData.workingDays,
          total_value: voucherData.totalValue,
          payment_date: voucherData.paymentDate || null,
          paid: voucherData.paid,
          notes: voucherData.notes,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchVouchers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar vale transporte');
      throw err;
    }
  };

  const updateVoucher = async (id: string, voucherData: Partial<TransportationVoucher>) => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (voucherData.employeeId !== undefined) updateData.employee_id = voucherData.employeeId;
      if (voucherData.referenceMonth !== undefined) updateData.reference_month = voucherData.referenceMonth;
      if (voucherData.dailyValue !== undefined) updateData.daily_value = voucherData.dailyValue;
      if (voucherData.workingDays !== undefined) updateData.working_days = voucherData.workingDays;
      if (voucherData.totalValue !== undefined) updateData.total_value = voucherData.totalValue;
      if (voucherData.paymentDate !== undefined) updateData.payment_date = voucherData.paymentDate || null;
      if (voucherData.paid !== undefined) updateData.paid = voucherData.paid;
      if (voucherData.notes !== undefined) updateData.notes = voucherData.notes;

      const { error } = await supabase
        .from('transportation_vouchers')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      await fetchVouchers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar vale transporte');
      throw err;
    }
  };

  const deleteVoucher = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transportation_vouchers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchVouchers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir vale transporte');
      throw err;
    }
  };

  const getVouchersByEmployee = (employeeId: string) => {
    return vouchers.filter(v => v.employeeId === employeeId);
  };

  const getVouchersByMonth = (month: string) => {
    return vouchers.filter(v => v.referenceMonth === month);
  };

  return (
    <TransportationVoucherContext.Provider
      value={{
        vouchers,
        loading,
        error,
        addVoucher,
        updateVoucher,
        deleteVoucher,
        getVouchersByEmployee,
        getVouchersByMonth,
      }}
    >
      {children}
    </TransportationVoucherContext.Provider>
  );
};
