import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, getCurrentUserId } from '../utils/supabase';
import { SobreavisoEmployee } from '../types';

interface SobreavisoContextType {
  sobreavisoEmployees: SobreavisoEmployee[];
  loading: boolean;
  error: string | null;
  addSobreavisoEmployee: (employee: Omit<SobreavisoEmployee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSobreavisoEmployee: (id: string, employee: Partial<SobreavisoEmployee>) => Promise<void>;
  deleteSobreavisoEmployee: (id: string) => Promise<void>;
  getSobreavisoEmployee: (id: string) => SobreavisoEmployee | undefined;
  getSobreavisoByUnit: (unit: string) => SobreavisoEmployee[];
}

const SobreavisoContext = createContext<SobreavisoContextType | undefined>(undefined);

export const useSobreaviso = () => {
  const context = useContext(SobreavisoContext);
  if (context === undefined) {
    throw new Error('useSobreaviso must be used within a SobreavisoProvider');
  }
  return context;
};

interface SobreavisoProviderProps {
  children: ReactNode;
}

export const SobreavisoProvider: React.FC<SobreavisoProviderProps> = ({ children }) => {
  const [sobreavisoEmployees, setSobreavisoEmployees] = useState<SobreavisoEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSobreavisoEmployees();
  }, []);

  const fetchSobreavisoEmployees = async () => {
    try {
      setError(null);
      
      // Try to fetch from Supabase first
      const { data, error } = await supabase
        .from('sobreaviso_employees')
        .select('*')
        .order('full_name');
      
      if (error) {
        // If table doesn't exist, fall back to localStorage
        if (error.code === 'PGRST205') {
          console.warn('sobreaviso_employees table not found, using localStorage');
          const stored = localStorage.getItem('sobreavisoEmployees');
          const localData = stored ? JSON.parse(stored) : [];
          setSobreavisoEmployees(localData);
          setLoading(false);
          return;
        }
        throw error;
      }
      
      // Transform data to match our SobreavisoEmployee type
      const transformedEmployees: SobreavisoEmployee[] = data.map(emp => ({
        id: emp.id,
        fullName: emp.full_name,
        cpf: emp.cpf,
        position: emp.position,
        phone: emp.phone,
        pix: emp.pix,
        unit: emp.unit,
        status: emp.status,
        observations: emp.observations,
        createdAt: emp.created_at,
        updatedAt: emp.updated_at,
      }));
      
      setSobreavisoEmployees(transformedEmployees);
    } catch (error) {
      console.error('Error fetching sobreaviso employees:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar funcionários de sobreaviso');
    } finally {
      setLoading(false);
    }
  };

  const addSobreavisoEmployee = async (employeeData: Omit<SobreavisoEmployee, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Try Supabase first
      try {
        const userId = await getCurrentUserId();
        
        const { data, error } = await supabase
          .from('sobreaviso_employees')
          .insert([{
            full_name: employeeData.fullName,
            cpf: employeeData.cpf,
            position: employeeData.position,
            phone: employeeData.phone,
            pix: employeeData.pix,
            unit: employeeData.unit,
            status: employeeData.status,
            observations: employeeData.observations,
            created_by: userId,
          }])
          .select()
          .single();
        
        if (error) throw error;
        await fetchSobreavisoEmployees();
        return;
      } catch (error: any) {
        // If table doesn't exist, fall back to localStorage
        if (error.code === 'PGRST205') {
          const newEmployee: SobreavisoEmployee = {
            id: crypto.randomUUID(),
            ...employeeData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          const stored = localStorage.getItem('sobreavisoEmployees');
          const localData = stored ? JSON.parse(stored) : [];
          const updatedData = [...localData, newEmployee];
          
          localStorage.setItem('sobreavisoEmployees', JSON.stringify(updatedData));
          setSobreavisoEmployees(updatedData);
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error adding sobreaviso employee:', error);
      throw error;
    }
  };

  const updateSobreavisoEmployee = async (id: string, employeeData: Partial<SobreavisoEmployee>) => {
    try {
      // Try Supabase first
      try {
        const updateData: any = {};
        
        if (employeeData.fullName !== undefined) updateData.full_name = employeeData.fullName;
        if (employeeData.cpf !== undefined) updateData.cpf = employeeData.cpf;
        if (employeeData.position !== undefined) updateData.position = employeeData.position;
        if (employeeData.phone !== undefined) updateData.phone = employeeData.phone;
        if (employeeData.pix !== undefined) updateData.pix = employeeData.pix;
        if (employeeData.unit !== undefined) updateData.unit = employeeData.unit;
        if (employeeData.status !== undefined) updateData.status = employeeData.status;
        if (employeeData.observations !== undefined) updateData.observations = employeeData.observations;
        
        const { error } = await supabase
          .from('sobreaviso_employees')
          .update(updateData)
          .eq('id', id);
        
        if (error) throw error;
        await fetchSobreavisoEmployees();
        return;
      } catch (error: any) {
        // If table doesn't exist, fall back to localStorage
        if (error.code === 'PGRST205') {
          const stored = localStorage.getItem('sobreavisoEmployees');
          const localData = stored ? JSON.parse(stored) : [];
          
          const updatedData = localData.map((emp: SobreavisoEmployee) => 
            emp.id === id 
              ? { ...emp, ...employeeData, updatedAt: new Date().toISOString() }
              : emp
          );
          
          localStorage.setItem('sobreavisoEmployees', JSON.stringify(updatedData));
          setSobreavisoEmployees(updatedData);
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error updating sobreaviso employee:', error);
      throw error;
    }
  };

  const deleteSobreavisoEmployee = async (id: string) => {
    try {
      // Try Supabase first
      try {
        const { error } = await supabase
          .from('sobreaviso_employees')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        await fetchSobreavisoEmployees();
        return;
      } catch (error: any) {
        // If table doesn't exist, fall back to localStorage
        if (error.code === 'PGRST205') {
          const stored = localStorage.getItem('sobreavisoEmployees');
          const localData = stored ? JSON.parse(stored) : [];
          
          const updatedData = localData.filter((emp: SobreavisoEmployee) => emp.id !== id);
          
          localStorage.setItem('sobreavisoEmployees', JSON.stringify(updatedData));
          setSobreavisoEmployees(updatedData);
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error deleting sobreaviso employee:', error);
      throw error;
    }
  };

  const getSobreavisoEmployee = (id: string) => {
    return sobreavisoEmployees.find(emp => emp.id === id);
  };

  const getSobreavisoByUnit = (unit: string) => {
    return sobreavisoEmployees.filter(emp => 
      emp.status === 'Ativo' && (emp.unit === unit || emp.unit === 'Ambas')
    );
  };

  const value = {
    sobreavisoEmployees,
    loading,
    error,
    addSobreavisoEmployee,
    updateSobreavisoEmployee,
    deleteSobreavisoEmployee,
    getSobreavisoEmployee,
    getSobreavisoByUnit,
  };

  return <SobreavisoContext.Provider value={value}>{children}</SobreavisoContext.Provider>;
};