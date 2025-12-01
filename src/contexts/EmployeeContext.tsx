import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, getCurrentUserId } from '../utils/supabase';
import { Employee } from '../types';

interface EmployeeContextType {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  getEmployee: (id: string) => Employee | undefined;
  getExpiringItems: () => ExpiringItem[];
}

interface ExpiringItem {
  employeeId: string;
  employeeName: string;
  type: 'Exame' | 'Vacina' | 'Carteira Profissional';
  description: string;
  expiryDate: string;
  daysUntilExpiry: number;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const useEmployees = () => {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployees must be used within an EmployeeProvider');
  }
  return context;
};

interface EmployeeProviderProps {
  children: ReactNode;
}

export const EmployeeProvider: React.FC<EmployeeProviderProps> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          employee_covid_vaccines(*),
          employee_medical_exams(*),
          employee_general_vaccines(*),
          employee_vacations(*)
        `)
        .order('full_name');
      
      if (error) throw error;
      
      // Transform data to match our Employee type
      const transformedEmployees: Employee[] = data.map(employee => ({
        id: employee.id,
        fullName: employee.full_name,
        cpf: employee.cpf,
        rg: employee.rg,
        birthDate: employee.birth_date,
        address: employee.address,
        position: employee.position,
        unit: employee.unit,
        status: employee.status,
        photo: employee.photo,
        observations: employee.observations,
        receivesTransportation: employee.receives_transportation || false,
        professionalLicense: employee.professional_license_council !== 'Não Possui' ? {
          council: employee.professional_license_council,
          licenseNumber: employee.professional_license_number,
          expiryDate: employee.professional_license_expiry_date,
        } : {
          council: 'Não Possui',
          licenseNumber: '',
          expiryDate: '',
        },
        exitDate: employee.exit_date,
        exitReason: employee.exit_reason,
        employmentType: employee.employment_type,
        cltData: employee.clt_data || {
          ctps: '',
          ctpsSeries: '',
          pis: '',
          voterTitle: '',
          voterZone: '',
          voterSection: '',
          medicalExams: employee.employee_medical_exams?.map((exam: any) => ({
            id: exam.id,
            type: exam.type,
            examDate: exam.exam_date,
            expiryDate: exam.expiry_date,
            result: exam.result,
            notes: exam.notes,
            attachment: exam.attachment,
          })) || [],
          generalVaccines: employee.employee_general_vaccines?.map((vaccine: any) => ({
            id: vaccine.id,
            type: vaccine.type,
            applicationDate: vaccine.application_date,
            expiryDate: vaccine.expiry_date,
            notes: vaccine.notes,
          })) || [],
          vacations: employee.employee_vacations?.map((vacation: any) => ({
            id: vacation.id,
            startDate: vacation.start_date,
            endDate: vacation.end_date,
            days: vacation.days,
            period: vacation.period,
            status: vacation.status,
          })) || [],
          inssDocument: '',
          contractAmendment: '',
          uniformSize: {
            shirt: 'M',
            pants: '',
            shoes: '',
            coat: 'M',
          },
        },
        contractData: employee.contract_data || {
          signedContract: '',
          contractStartDate: '',
          contractEndDate: '',
          bankData: {
            bank: '',
            agency: '',
            account: '',
            accountType: 'Corrente',
            pix: '',
          },
          profession: '',
          phone: '',
          email: '',
        },
        outsourcedData: employee.outsourced_data || {
          companyName: '',
          companyCnpj: '',
          directSupervisor: '',
          serviceType: '',
          contractStartDate: '',
          contractEndDate: '',
        },
        covidVaccines: employee.employee_covid_vaccines?.map((vaccine: any) => ({
          id: vaccine.id,
          dose: vaccine.dose,
          vaccineType: vaccine.vaccine_type,
          applicationDate: vaccine.application_date,
          expiryDate: vaccine.expiry_date,
          notes: vaccine.notes,
        })) || [],
        createdAt: employee.created_at,
        updatedAt: employee.updated_at,
      }));
      
      setEmployees(transformedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar funcionários');
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const userId = await getCurrentUserId();
      
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          full_name: employeeData.fullName,
          cpf: employeeData.cpf,
          rg: employeeData.rg,
          birth_date: employeeData.birthDate || null,
          address: employeeData.address,
          position: employeeData.position,
          unit: employeeData.unit,
          status: employeeData.status,
          photo: employeeData.photo,
          observations: employeeData.observations,
          receives_transportation: employeeData.receivesTransportation || false,
          professional_license_council: employeeData.professionalLicense?.council || 'Não Possui',
          professional_license_number: employeeData.professionalLicense?.licenseNumber,
          professional_license_expiry_date: employeeData.professionalLicense?.expiryDate || null,
          exit_date: employeeData.exitDate || null,
          exit_reason: employeeData.exitReason || null,
          employment_type: employeeData.employmentType,
          clt_data: employeeData.cltData,
          contract_data: employeeData.contractData,
          outsourced_data: employeeData.outsourcedData,
          created_by: userId,
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Add COVID vaccines if any
      if (employeeData.covidVaccines.length > 0) {
        const vaccineInserts = employeeData.covidVaccines.map(vaccine => ({
          employee_id: data.id,
          dose: vaccine.dose,
          vaccine_type: vaccine.vaccineType,
          application_date: vaccine.applicationDate,
          expiry_date: vaccine.expiryDate,
          notes: vaccine.notes,
        }));
        
        await supabase.from('employee_covid_vaccines').insert(vaccineInserts);
      }
      
      // Add medical exams if CLT
      if (employeeData.employmentType === 'CLT' && employeeData.cltData?.medicalExams.length > 0) {
        const examInserts = employeeData.cltData.medicalExams.map(exam => ({
          employee_id: data.id,
          type: exam.type,
          exam_date: exam.examDate,
          expiry_date: exam.expiryDate,
          result: exam.result,
          notes: exam.notes,
          attachment: exam.attachment,
        }));
        
        await supabase.from('employee_medical_exams').insert(examInserts);
      }
      
      // Add general vaccines if CLT
      if (employeeData.employmentType === 'CLT' && employeeData.cltData?.generalVaccines.length > 0) {
        const vaccineInserts = employeeData.cltData.generalVaccines.map(vaccine => ({
          employee_id: data.id,
          type: vaccine.type,
          application_date: vaccine.applicationDate,
          expiry_date: vaccine.expiryDate,
          notes: vaccine.notes,
        }));
        
        await supabase.from('employee_general_vaccines').insert(vaccineInserts);
      }
      
      // Add vacations if CLT
      if (employeeData.employmentType === 'CLT' && employeeData.cltData?.vacations.length > 0) {
        const vacationInserts = employeeData.cltData.vacations.map(vacation => ({
          employee_id: data.id,
          start_date: vacation.startDate,
          end_date: vacation.endDate,
          days: vacation.days,
          period: vacation.period,
          status: vacation.status,
        }));
        
        await supabase.from('employee_vacations').insert(vacationInserts);
      }
      
      await fetchEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      alert(`Erro ao adicionar colaborador: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      throw error;
    }
  };

  const updateEmployee = async (id: string, employeeData: Partial<Employee>) => {
    try {
      const updateData: any = {};
      
      if (employeeData.fullName !== undefined) updateData.full_name = employeeData.fullName;
      if (employeeData.cpf !== undefined) updateData.cpf = employeeData.cpf;
      if (employeeData.rg !== undefined) updateData.rg = employeeData.rg;
      if (employeeData.birthDate !== undefined) updateData.birth_date = employeeData.birthDate || null;
      if (employeeData.address !== undefined) updateData.address = employeeData.address;
      if (employeeData.position !== undefined) updateData.position = employeeData.position;
      if (employeeData.unit !== undefined) updateData.unit = employeeData.unit;
      if (employeeData.status !== undefined) updateData.status = employeeData.status;
      if (employeeData.photo !== undefined) updateData.photo = employeeData.photo;
      if (employeeData.observations !== undefined) updateData.observations = employeeData.observations;
      if (employeeData.receivesTransportation !== undefined) updateData.receives_transportation = employeeData.receivesTransportation;
      if (employeeData.professionalLicense !== undefined) {
        updateData.professional_license_council = employeeData.professionalLicense.council;
        updateData.professional_license_number = employeeData.professionalLicense.licenseNumber;
        updateData.professional_license_expiry_date = employeeData.professionalLicense.expiryDate || null;
      }
      if (employeeData.employmentType !== undefined) updateData.employment_type = employeeData.employmentType;
      if (employeeData.cltData !== undefined) updateData.clt_data = employeeData.cltData;
      if (employeeData.contractData !== undefined) updateData.contract_data = employeeData.contractData;
      if (employeeData.outsourcedData !== undefined) updateData.outsourced_data = employeeData.outsourcedData;
      if (employeeData.exitDate !== undefined) updateData.exit_date = employeeData.exitDate || null;
      if (employeeData.exitReason !== undefined) updateData.exit_reason = employeeData.exitReason || null;
      
      const { error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      // Handle COVID vaccines update if provided
      if (employeeData.covidVaccines !== undefined) {
        await supabase.from('employee_covid_vaccines').delete().eq('employee_id', id);
        
        if (employeeData.covidVaccines.length > 0) {
          const vaccineInserts = employeeData.covidVaccines.map(vaccine => ({
            employee_id: id,
            dose: vaccine.dose,
            vaccine_type: vaccine.vaccineType,
            application_date: vaccine.applicationDate,
            expiry_date: vaccine.expiryDate,
            notes: vaccine.notes,
          }));
          
          await supabase.from('employee_covid_vaccines').insert(vaccineInserts);
        }
      }
      
      await fetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const getEmployee = (id: string) => {
    return employees.find(employee => employee.id === id);
  };

  const getExpiringItems = (): ExpiringItem[] => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    const expiringItems: ExpiringItem[] = [];

    employees.forEach(employee => {
      // Verificar exames médicos (CLT)
      if (employee.cltData?.medicalExams) {
        employee.cltData.medicalExams.forEach(exam => {
          const expiryDate = new Date(exam.expiryDate);
          if (expiryDate >= today && expiryDate <= thirtyDaysFromNow) {
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            expiringItems.push({
              employeeId: employee.id,
              employeeName: employee.fullName,
              type: 'Exame',
              description: `${exam.type} - ${exam.result}`,
              expiryDate: exam.expiryDate,
              daysUntilExpiry,
            });
          }
        });
      }

      // Verificar vacinas gerais (CLT)
      if (employee.cltData?.generalVaccines) {
        employee.cltData.generalVaccines.forEach(vaccine => {
          if (vaccine.expiryDate) {
            const expiryDate = new Date(vaccine.expiryDate);
            if (expiryDate >= today && expiryDate <= thirtyDaysFromNow) {
              const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
              expiringItems.push({
                employeeId: employee.id,
                employeeName: employee.fullName,
                type: 'Vacina',
                description: `${vaccine.type}`,
                expiryDate: vaccine.expiryDate,
                daysUntilExpiry,
              });
            }
          }
        });
      }

      // Verificar vacinas COVID
      employee.covidVaccines.forEach(vaccine => {
        if (vaccine.expiryDate) {
          const expiryDate = new Date(vaccine.expiryDate);
          if (expiryDate >= today && expiryDate <= thirtyDaysFromNow) {
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            expiringItems.push({
              employeeId: employee.id,
              employeeName: employee.fullName,
              type: 'Vacina',
              description: `COVID ${vaccine.dose} - ${vaccine.vaccineType}`,
              expiryDate: vaccine.expiryDate,
              daysUntilExpiry,
            });
          }
        }
      });

      // Verificar carteira profissional
      if (employee.professionalLicense?.expiryDate) {
        const expiryDate = new Date(employee.professionalLicense.expiryDate);
        if (expiryDate >= today && expiryDate <= thirtyDaysFromNow) {
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
          expiringItems.push({
            employeeId: employee.id,
            employeeName: employee.fullName,
            type: 'Carteira Profissional',
            description: `${employee.professionalLicense.council} - ${employee.professionalLicense.licenseNumber}`,
            expiryDate: employee.professionalLicense.expiryDate,
            daysUntilExpiry,
          });
        }
      }
    });

    return expiringItems.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  };

  const value = {
    employees,
    loading,
    error,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee,
    getExpiringItems,
  };

  return <EmployeeContext.Provider value={value}>{children}</EmployeeContext.Provider>;
};