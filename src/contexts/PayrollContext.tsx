import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';
import { PayrollRecord, PayrollAdjustment, PayrollContextType } from '../types';

const PayrollContext = createContext<PayrollContextType | undefined>(undefined);

export const PayrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [adjustments, setAdjustments] = useState<PayrollAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPayrolls();
      fetchAdjustments();
    }
  }, [user]);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('payroll_records')
        .select('*')
        .order('reference_year', { ascending: false })
        .order('reference_month', { ascending: false });

      if (fetchError) throw fetchError;

      const { data: employeesData } = await supabase
        .from('employees')
        .select('id, full_name');

      const { data: sobreavisoData } = await supabase
        .from('sobreaviso_employees')
        .select('id, full_name');

      const employeesMap = new Map();
      employeesData?.forEach(emp => employeesMap.set(emp.id, emp.full_name));
      sobreavisoData?.forEach(emp => employeesMap.set(emp.id, emp.full_name));

      const formattedData = data?.map((record: any) => ({
        id: record.id,
        employeeId: record.employee_id,
        employeeName: employeesMap.get(record.employee_id) || 'Nome não encontrado',
        employmentType: record.employment_type,
        referenceMonth: record.reference_month,
        referenceYear: record.reference_year,
        baseSalary: parseFloat(record.base_salary),
        overtimeHours: parseFloat(record.overtime_hours || 0),
        overtimeAmount: parseFloat(record.overtime_amount || 0),
        nightShiftHours: parseFloat(record.night_shift_hours || 0),
        nightShiftAmount: parseFloat(record.night_shift_amount || 0),
        hazardPay: parseFloat(record.hazard_pay || 0),
        foodAllowance: parseFloat(record.food_allowance || 0),
        transportationAllowance: parseFloat(record.transportation_allowance || 0),
        healthInsurance: parseFloat(record.health_insurance || 0),
        otherBenefits: parseFloat(record.other_benefits || 0),
        inssDeduction: parseFloat(record.inss_deduction || 0),
        irrfDeduction: parseFloat(record.irrf_deduction || 0),
        otherDeductions: parseFloat(record.other_deductions || 0),
        grossSalary: parseFloat(record.gross_salary),
        netSalary: parseFloat(record.net_salary),
        paymentDate: record.payment_date,
        paymentStatus: record.payment_status,
        paymentMethod: record.payment_method,
        notes: record.notes,
        workDates: record.work_dates || [],
        simplifiedPayment: record.simplified_payment || false,
        createdBy: record.created_by,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      })) || [];

      setPayrolls(formattedData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar folhas de pagamento');
      console.error('Error fetching payrolls:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdjustments = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('payroll_adjustments')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const formattedData = data?.map((adj: any) => ({
        id: adj.id,
        payrollId: adj.payroll_id,
        adjustmentType: adj.adjustment_type,
        amount: parseFloat(adj.amount),
        reason: adj.reason,
        createdBy: adj.created_by,
        createdAt: adj.created_at,
      })) || [];

      setAdjustments(formattedData);
    } catch (err) {
      console.error('Error fetching adjustments:', err);
    }
  };

  const addPayroll = async (payroll: Omit<PayrollRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('PayrollContext - Adding payroll:', payroll);

      const insertData = {
        employee_id: payroll.employeeId,
        employment_type: payroll.employmentType || null,
        reference_month: payroll.referenceMonth,
        reference_year: payroll.referenceYear,
        base_salary: payroll.baseSalary || 0,
        overtime_hours: payroll.overtimeHours || 0,
        overtime_amount: payroll.overtimeAmount || 0,
        night_shift_hours: payroll.nightShiftHours || 0,
        night_shift_amount: payroll.nightShiftAmount || 0,
        hazard_pay: payroll.hazardPay || 0,
        food_allowance: payroll.foodAllowance || 0,
        transportation_allowance: payroll.transportationAllowance || 0,
        health_insurance: payroll.healthInsurance || 0,
        other_benefits: payroll.otherBenefits || 0,
        inss_deduction: payroll.inssDeduction || 0,
        irrf_deduction: payroll.irrfDeduction || 0,
        other_deductions: payroll.otherDeductions || 0,
        gross_salary: payroll.grossSalary || 0,
        net_salary: payroll.netSalary || 0,
        payment_date: payroll.paymentDate || null,
        payment_status: payroll.paymentStatus || 'pending',
        payment_method: payroll.paymentMethod || null,
        notes: payroll.notes || null,
        work_dates: payroll.workDates || [],
        simplified_payment: payroll.simplifiedPayment || false,
        created_by: user?.id,
      };

      console.log('PayrollContext - Insert data:', insertData);

      const { data, error: insertError } = await supabase
        .from('payroll_records')
        .insert([insertData])
        .select()
        .single();

      if (insertError) {
        console.error('PayrollContext - Insert error:', insertError);
        throw insertError;
      }

      console.log('PayrollContext - Successfully inserted:', data);
      await fetchPayrolls();
    } catch (err) {
      console.error('PayrollContext - Error in addPayroll:', err);
      setError(err instanceof Error ? err.message : 'Erro ao adicionar folha de pagamento');
      throw err;
    }
  };

  const updatePayroll = async (id: string, payroll: Partial<PayrollRecord>) => {
    try {
      const updateData: any = {};

      if (payroll.employeeId !== undefined) updateData.employee_id = payroll.employeeId;
      if (payroll.employmentType !== undefined) updateData.employment_type = payroll.employmentType;
      if (payroll.referenceMonth !== undefined) updateData.reference_month = payroll.referenceMonth;
      if (payroll.referenceYear !== undefined) updateData.reference_year = payroll.referenceYear;
      if (payroll.baseSalary !== undefined) updateData.base_salary = payroll.baseSalary;
      if (payroll.overtimeHours !== undefined) updateData.overtime_hours = payroll.overtimeHours;
      if (payroll.overtimeAmount !== undefined) updateData.overtime_amount = payroll.overtimeAmount;
      if (payroll.nightShiftHours !== undefined) updateData.night_shift_hours = payroll.nightShiftHours;
      if (payroll.nightShiftAmount !== undefined) updateData.night_shift_amount = payroll.nightShiftAmount;
      if (payroll.hazardPay !== undefined) updateData.hazard_pay = payroll.hazardPay;
      if (payroll.foodAllowance !== undefined) updateData.food_allowance = payroll.foodAllowance;
      if (payroll.transportationAllowance !== undefined) updateData.transportation_allowance = payroll.transportationAllowance;
      if (payroll.healthInsurance !== undefined) updateData.health_insurance = payroll.healthInsurance;
      if (payroll.otherBenefits !== undefined) updateData.other_benefits = payroll.otherBenefits;
      if (payroll.inssDeduction !== undefined) updateData.inss_deduction = payroll.inssDeduction;
      if (payroll.irrfDeduction !== undefined) updateData.irrf_deduction = payroll.irrfDeduction;
      if (payroll.otherDeductions !== undefined) updateData.other_deductions = payroll.otherDeductions;
      if (payroll.grossSalary !== undefined) updateData.gross_salary = payroll.grossSalary;
      if (payroll.netSalary !== undefined) updateData.net_salary = payroll.netSalary;
      if (payroll.paymentDate !== undefined) updateData.payment_date = payroll.paymentDate;
      if (payroll.paymentStatus !== undefined) updateData.payment_status = payroll.paymentStatus;
      if (payroll.paymentMethod !== undefined) updateData.payment_method = payroll.paymentMethod;
      if (payroll.notes !== undefined) updateData.notes = payroll.notes;
      if (payroll.workDates !== undefined) updateData.work_dates = payroll.workDates;
      if (payroll.simplifiedPayment !== undefined) updateData.simplified_payment = payroll.simplifiedPayment;

      const { error: updateError } = await supabase
        .from('payroll_records')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchPayrolls();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar folha de pagamento');
      throw err;
    }
  };

  const deletePayroll = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('payroll_records')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchPayrolls();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir folha de pagamento');
      throw err;
    }
  };

  const addAdjustment = async (adjustment: Omit<PayrollAdjustment, 'id' | 'createdAt'>) => {
    try {
      const { error: insertError } = await supabase
        .from('payroll_adjustments')
        .insert([{
          payroll_id: adjustment.payrollId,
          adjustment_type: adjustment.adjustmentType,
          amount: adjustment.amount,
          reason: adjustment.reason,
          created_by: user?.id,
        }]);

      if (insertError) throw insertError;

      await fetchAdjustments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar ajuste');
      throw err;
    }
  };

  const getPayrollsByEmployee = (employeeId: string) => {
    return payrolls.filter(p => p.employeeId === employeeId);
  };

  const getPayrollsByMonth = (month: string, year: number) => {
    return payrolls.filter(p => p.referenceMonth === month && p.referenceYear === year);
  };

  const getAdjustmentsByPayroll = (payrollId: string) => {
    return adjustments.filter(a => a.payrollId === payrollId);
  };

  const getShiftPaymentsByEmployeeAndMonth = async (employeeId: string, month: string, year: number) => {
    try {
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = new Date(year, parseInt(month), 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('shift_payments')
        .select(`
          *,
          sobreaviso_employees!inner(id, full_name)
        `)
        .eq('sobreaviso_employees.id', employeeId)
        .gte('shift_date', startDate)
        .lte('shift_date', endDate)
        .order('shift_date');

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error fetching shift payments:', err);
      return [];
    }
  };

  return (
    <PayrollContext.Provider value={{
      payrolls,
      adjustments,
      loading,
      error,
      addPayroll,
      updatePayroll,
      deletePayroll,
      getPayrollsByEmployee,
      getPayrollsByMonth,
      addAdjustment,
      getAdjustmentsByPayroll,
      getShiftPaymentsByEmployeeAndMonth,
    }}>
      {children}
    </PayrollContext.Provider>
  );
};

export const usePayroll = () => {
  const context = useContext(PayrollContext);
  if (context === undefined) {
    throw new Error('usePayroll must be used within a PayrollProvider');
  }
  return context;
};
