import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, getCurrentUserId } from '../utils/supabase';
import { WorkSchedule, ScheduleEmployee, ShiftType, ScheduleSubstitution } from '../types';

interface ScheduleContextType {
  schedules: WorkSchedule[];
  substitutions: ScheduleSubstitution[];
  getScheduleEmployees: (scheduleType: 'Geral' | 'Enfermagem' | 'Nutrição', unit: string) => ScheduleEmployee[];
  getScheduleForMonth: (scheduleType: string, unit: string, month: number, year: number) => WorkSchedule[];
  getSubstitutionsForMonth: (scheduleType: string, unit: string, month: number, year: number) => ScheduleSubstitution[];
  updateScheduleDay: (employeeId: string, scheduleType: string, unit: string, month: number, year: number, day: number, shift: ShiftType | null) => Promise<void>;
  addSubstitution: (substitution: Omit<ScheduleSubstitution, 'id' | 'createdAt'>) => Promise<void>;
  removeSubstitution: (employeeId: string, scheduleType: string, unit: string, month: number, year: number, day: number) => Promise<void>;
  clearScheduleForMonth: (scheduleType: string, unit: string, month: number, year: number) => Promise<void>;
  loading: boolean;
  tableNotFound: boolean;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};

interface ScheduleProviderProps {
  children: ReactNode;
}

export const ScheduleProvider: React.FC<ScheduleProviderProps> = ({ children }) => {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [substitutions, setSubstitutions] = useState<ScheduleSubstitution[]>([]);
  const [employees, setEmployees] = useState<ScheduleEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableNotFound, setTableNotFound] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchSchedules();
    fetchSubstitutions();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, position, cpf, professional_license_number, unit, status')
        .eq('status', 'Ativo')
        .order('full_name');
      
      if (error) throw error;
      
      const transformedEmployees: ScheduleEmployee[] = data.map(emp => ({
        id: emp.id,
        name: emp.full_name,
        position: emp.position,
        cpf: emp.cpf,
        professionalRegistry: emp.professional_license_number,
        unit: emp.unit,
      }));
      
      setEmployees(transformedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchSchedules = async () => {
    try {
      // Tentar consultar a tabela diretamente
      const { data, error } = await supabase
        .from('work_schedules')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      
      // Se a tabela não existir, capturar o erro e definir o estado apropriado
      if (error && (error.code === 'PGRST205' || error.code === 'PGRST116' || error.message.includes('Could not find the table') || error.message.includes('relation "work_schedules" does not exist'))) {
        console.log('Table work_schedules does not exist');
        setSchedules([]);
        setTableNotFound(true);
        setLoading(false);
        return;
      }
      
      if (error) throw error;
      
      const transformedSchedules: WorkSchedule[] = data.map(schedule => ({
        id: schedule.id,
        employeeId: schedule.employee_id,
        scheduleType: schedule.schedule_type,
        unit: schedule.unit,
        month: schedule.month,
        year: schedule.year,
        day1: schedule.day_1,
        day2: schedule.day_2,
        day3: schedule.day_3,
        day4: schedule.day_4,
        day5: schedule.day_5,
        day6: schedule.day_6,
        day7: schedule.day_7,
        day8: schedule.day_8,
        day9: schedule.day_9,
        day10: schedule.day_10,
        day11: schedule.day_11,
        day12: schedule.day_12,
        day13: schedule.day_13,
        day14: schedule.day_14,
        day15: schedule.day_15,
        day16: schedule.day_16,
        day17: schedule.day_17,
        day18: schedule.day_18,
        day19: schedule.day_19,
        day20: schedule.day_20,
        day21: schedule.day_21,
        day22: schedule.day_22,
        day23: schedule.day_23,
        day24: schedule.day_24,
        day25: schedule.day_25,
        day26: schedule.day_26,
        day27: schedule.day_27,
        day28: schedule.day_28,
        day29: schedule.day_29,
        day30: schedule.day_30,
        day31: schedule.day_31,
        createdAt: schedule.created_at,
        updatedAt: schedule.updated_at,
      }));
      
      setSchedules(transformedSchedules);
      setTableNotFound(false);
    } catch (error) {
      console.log('Error fetching schedules - likely table does not exist:', error);
      // Para qualquer erro (rede, tabela inexistente, etc), definir como tabela não encontrada
      setSchedules([]);
      setTableNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from('schedule_substitutions')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .order('day', { ascending: true });
      
      if (error) {
        console.log('Error fetching substitutions (table may not exist):', error);
        setSubstitutions([]);
        return;
      }
      
      const transformedSubstitutions: ScheduleSubstitution[] = data.map(sub => ({
        id: sub.id,
        employeeId: sub.employee_id,
        scheduleType: sub.schedule_type,
        unit: sub.unit,
        month: sub.month,
        year: sub.year,
        day: sub.day,
        substituteId: sub.substitute_id,
        substituteName: sub.substitute_name,
        reason: sub.reason,
        createdAt: sub.created_at,
      }));
      
      setSubstitutions(transformedSubstitutions);
    } catch (error) {
      console.error('Error fetching substitutions:', error);
      setSubstitutions([]);
    }
  };

  const getScheduleEmployees = (scheduleType: 'Geral' | 'Enfermagem' | 'Nutrição', unit: string): ScheduleEmployee[] => {
    if (scheduleType === 'Enfermagem') {
      return employees.filter(emp => 
        emp.unit === unit && 
        (emp.position === 'Enfermeira' || 
         emp.position === 'Técnico de Enfermagem' || 
         emp.position === 'Cuidador de Idosos')
      );
    }
    
    if (scheduleType === 'Nutrição') {
      return employees.filter(emp => 
        emp.unit === unit && 
        (emp.position === 'Nutricionista' || emp.position === 'Cozinheira')
      );
    }
    
    // Escala Geral - todos os colaboradores
    return employees.filter(emp => emp.unit === unit);
  };

  const getScheduleForMonth = (scheduleType: string, unit: string, month: number, year: number): WorkSchedule[] => {
    return schedules.filter(schedule => 
      schedule.scheduleType === scheduleType &&
      schedule.unit === unit &&
      schedule.month === month &&
      schedule.year === year
    );
  };

  const getSubstitutionsForMonth = (scheduleType: string, unit: string, month: number, year: number): ScheduleSubstitution[] => {
    return substitutions.filter(sub => 
      sub.scheduleType === scheduleType &&
      sub.unit === unit &&
      sub.month === month &&
      sub.year === year
    );
  };

  const createScheduleForEmployee = async (employeeId: string, scheduleType: string, unit: string, month: number, year: number) => {
    try {
      const userId = await getCurrentUserId();
      
      const { error } = await supabase
        .from('work_schedules')
        .insert([{
          employee_id: employeeId,
          schedule_type: scheduleType,
          unit: unit,
          month: month,
          year: year,
          created_by: userId,
        }]);
      
      if (error) throw error;
      
      await fetchSchedules();
    } catch (error) {
      console.error('Error creating schedule for employee:', error);
    }
  };

  const addSubstitution = async (substitutionData: Omit<ScheduleSubstitution, 'id' | 'createdAt'>) => {
    try {
      const { error } = await supabase
        .from('schedule_substitutions')
        .insert([{
          employee_id: substitutionData.employeeId,
          schedule_type: substitutionData.scheduleType,
          unit: substitutionData.unit,
          month: substitutionData.month,
          year: substitutionData.year,
          day: substitutionData.day,
          substitute_id: substitutionData.substituteId,
          substitute_name: substitutionData.substituteName,
          reason: substitutionData.reason,
        }]);
      
      if (error) throw error;
      
      await fetchSubstitutions();
    } catch (error) {
      console.error('Error adding substitution:', error);
      throw error;
    }
  };

  const removeSubstitution = async (employeeId: string, scheduleType: string, unit: string, month: number, year: number, day: number) => {
    try {
      const { error } = await supabase
        .from('schedule_substitutions')
        .delete()
        .eq('employee_id', employeeId)
        .eq('schedule_type', scheduleType)
        .eq('unit', unit)
        .eq('month', month)
        .eq('year', year)
        .eq('day', day);
      
      if (error) throw error;
      
      await fetchSubstitutions();
    } catch (error) {
      console.error('Error removing substitution:', error);
      throw error;
    }
  };
  const updateScheduleDay = async (employeeId: string, scheduleType: string, unit: string, month: number, year: number, day: number, shift: ShiftType | null) => {
    try {
      const userId = await getCurrentUserId();

      const dayColumn = `day_${day}`;

      // Usar upsert para evitar erro de chave duplicada
      const { error } = await supabase
        .from('work_schedules')
        .upsert([{
          employee_id: employeeId,
          schedule_type: scheduleType,
          unit: unit,
          month: month,
          year: year,
          [dayColumn]: shift,
          created_by: userId,
        }], {
          onConflict: 'employee_id,schedule_type,unit,month,year',
        });
      
      if (error) throw error;
      
      await fetchSchedules();
    } catch (error) {
      console.error('Error updating schedule day:', error);
      throw error;
    }
  }

  const clearScheduleForMonth = async (scheduleType: string, unit: string, month: number, year: number) => {
    try {
      // Limpar escalas
      const { error: scheduleError } = await supabase
        .from('work_schedules')
        .delete()
        .eq('schedule_type', scheduleType)
        .eq('unit', unit)
        .eq('month', month)
        .eq('year', year);
      
      if (scheduleError) throw scheduleError;
      
      // Limpar substituições do mês
      const { error: substitutionError } = await supabase
        .from('schedule_substitutions')
        .delete()
        .eq('schedule_type', scheduleType)
        .eq('unit', unit)
        .eq('month', month)
        .eq('year', year);
      
      if (substitutionError) throw substitutionError;
      
      await fetchSchedules();
      await fetchSubstitutions();
    } catch (error) {
      console.error('Error clearing schedule:', error);
      throw error;
    }
  };
  const value = {
    schedules,
    substitutions,
    getScheduleEmployees,
    getScheduleForMonth,
    getSubstitutionsForMonth,
    updateScheduleDay,
    addSubstitution,
    removeSubstitution,
    clearScheduleForMonth,
    loading,
    tableNotFound,
  };

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
};
