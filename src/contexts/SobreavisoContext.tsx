import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SobreavisoEmployee } from '../types';

interface SobreavisoContextType {
  sobreavisoEmployees: SobreavisoEmployee[];
  addSobreavisoEmployee: (employee: Omit<SobreavisoEmployee, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSobreavisoEmployee: (id: string, employee: Partial<SobreavisoEmployee>) => void;
  deleteSobreavisoEmployee: (id: string) => void;
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

  useEffect(() => {
    const savedEmployees = localStorage.getItem('acasa_sobreaviso_employees');
    if (savedEmployees) {
      setSobreavisoEmployees(JSON.parse(savedEmployees));
    }
  }, []);

  const saveEmployees = (updatedEmployees: SobreavisoEmployee[]) => {
    setSobreavisoEmployees(updatedEmployees);
    localStorage.setItem('acasa_sobreaviso_employees', JSON.stringify(updatedEmployees));
  };

  const addSobreavisoEmployee = (employeeData: Omit<SobreavisoEmployee, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEmployee: SobreavisoEmployee = {
      ...employeeData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedEmployees = [...sobreavisoEmployees, newEmployee];
    saveEmployees(updatedEmployees);
  };

  const updateSobreavisoEmployee = (id: string, employeeData: Partial<SobreavisoEmployee>) => {
    const updatedEmployees = sobreavisoEmployees.map(emp => 
      emp.id === id 
        ? { ...emp, ...employeeData, updatedAt: new Date().toISOString() }
        : emp
    );
    saveEmployees(updatedEmployees);
  };

  const deleteSobreavisoEmployee = (id: string) => {
    const updatedEmployees = sobreavisoEmployees.filter(emp => emp.id !== id);
    saveEmployees(updatedEmployees);
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
    addSobreavisoEmployee,
    updateSobreavisoEmployee,
    deleteSobreavisoEmployee,
    getSobreavisoEmployee,
    getSobreavisoByUnit,
  };

  return <SobreavisoContext.Provider value={value}>{children}</SobreavisoContext.Provider>;
};