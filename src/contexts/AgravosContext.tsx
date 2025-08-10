import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { DailyAgravosRecord, AgravoEvent, MonthlyAgravosIndicators, AnnualAgravosSummary } from '../types/agravos';
import { useGuests } from './GuestContext';

interface AgravosContextType {
  dailyRecords: DailyAgravosRecord[];
  monthlyIndicators: MonthlyAgravosIndicators[];
  annualSummaries: AnnualAgravosSummary[];
  
  // CRUD para registros diários
  addDailyRecord: (record: Omit<DailyAgravosRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  updateDailyRecord: (id: string, record: Partial<DailyAgravosRecord>) => void;
  getDailyRecord: (date: string, unit: string) => DailyAgravosRecord | undefined;
  getDailyRecordsForMonth: (month: number, year: number, unit: string) => DailyAgravosRecord[];
  
  // Eventos específicos
  addEvent: (recordId: string, event: Omit<AgravoEvent, 'id'>) => void;
  updateEvent: (recordId: string, eventId: string, eventData: Partial<AgravoEvent>) => void;
  removeEvent: (recordId: string, eventId: string) => void;
  
  // Indicadores e relatórios
  calculateMonthlyIndicators: (month: number, year: number, unit: string, populacaoBase: number) => MonthlyAgravosIndicators;
  generateAnnualSummary: (year: number, unit: string) => AnnualAgravosSummary;
  getMonthlyIndicators: (month: number, year: number, unit: string) => MonthlyAgravosIndicators | undefined;
  
  // Alertas
  getFrequentAgravoAlerts: () => AgravoAlert[];
  
  loading: boolean;
  error: string | null;
}

interface AgravoAlert {
  type: string;
  frequency: number;
  lastOccurrence: string;
  affectedResidents: string[];
  message: string;
  severity: 'low' | 'medium' | 'high';
}

const AgravosContext = createContext<AgravosContextType | undefined>(undefined);

export const useAgravos = () => {
  const context = useContext(AgravosContext);
  if (context === undefined) {
    throw new Error('useAgravos must be used within an AgravosProvider');
  }
  return context;
};

interface AgravosProviderProps {
  children: ReactNode;
}

export const AgravosProvider: React.FC<AgravosProviderProps> = ({ children }) => {
  const { guests } = useGuests();
  const [dailyRecords, setDailyRecords] = useState<DailyAgravosRecord[]>([]);
  const [monthlyIndicators, setMonthlyIndicators] = useState<MonthlyAgravosIndicators[]>([]);
  const [annualSummaries, setAnnualSummaries] = useState<AnnualAgravosSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const savedRecords = localStorage.getItem('acasa_agravos_daily_records');
      if (savedRecords) {
        setDailyRecords(JSON.parse(savedRecords));
      }

      const savedIndicators = localStorage.getItem('acasa_agravos_monthly_indicators');
      if (savedIndicators) {
        setMonthlyIndicators(JSON.parse(savedIndicators));
      }

      const savedSummaries = localStorage.getItem('acasa_agravos_annual_summaries');
      if (savedSummaries) {
        setAnnualSummaries(JSON.parse(savedSummaries));
      }
    } catch (err) {
      setError('Erro ao carregar dados de agravos');
    }
  };

  const saveData = () => {
    localStorage.setItem('acasa_agravos_daily_records', JSON.stringify(dailyRecords));
    localStorage.setItem('acasa_agravos_monthly_indicators', JSON.stringify(monthlyIndicators));
    localStorage.setItem('acasa_agravos_annual_summaries', JSON.stringify(annualSummaries));
  };

  const addDailyRecord = (recordData: Omit<DailyAgravosRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const newRecord: DailyAgravosRecord = {
      ...recordData,
      id: Date.now().toString(),
      createdBy: 'current-user', // TODO: pegar do contexto de auth
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedRecords = [...dailyRecords, newRecord];
    setDailyRecords(updatedRecords);
    localStorage.setItem('acasa_agravos_daily_records', JSON.stringify(updatedRecords));
  };

  const updateDailyRecord = (id: string, recordData: Partial<DailyAgravosRecord>) => {
    const updatedRecords = dailyRecords.map(record =>
      record.id === id
        ? { ...record, ...recordData, updatedAt: new Date().toISOString() }
        : record
    );
    setDailyRecords(updatedRecords);
    localStorage.setItem('acasa_agravos_daily_records', JSON.stringify(updatedRecords));
  };

  const getDailyRecord = (date: string, unit: string) => {
    return dailyRecords.find(record => record.date === date && record.unit === unit);
  };

  const getDailyRecordsForMonth = (month: number, year: number, unit: string) => {
    return dailyRecords.filter(record => 
      record.month === month && record.year === year && record.unit === unit
    );
  };

  const addEvent = (recordId: string, eventData: Omit<AgravoEvent, 'id'>) => {
    const newEvent: AgravoEvent = {
      ...eventData,
      id: Date.now().toString(),
    };

    const updatedRecords = dailyRecords.map(record => {
      if (record.id === recordId) {
        return {
          ...record,
          eventos: [...record.eventos, newEvent],
          updatedAt: new Date().toISOString(),
        };
      }
      return record;
    });

    setDailyRecords(updatedRecords);
    localStorage.setItem('acasa_agravos_daily_records', JSON.stringify(updatedRecords));
  };

  const updateEvent = (recordId: string, eventId: string, eventData: Partial<AgravoEvent>) => {
    const updatedRecords = dailyRecords.map(record => {
      if (record.id === recordId) {
        return {
          ...record,
          eventos: record.eventos.map(event =>
            event.id === eventId ? { ...event, ...eventData } : event
          ),
          updatedAt: new Date().toISOString(),
        };
      }
      return record;
    });

    setDailyRecords(updatedRecords);
    localStorage.setItem('acasa_agravos_daily_records', JSON.stringify(updatedRecords));
  };

  const removeEvent = (recordId: string, eventId: string) => {
    const updatedRecords = dailyRecords.map(record => {
      if (record.id === recordId) {
        return {
          ...record,
          eventos: record.eventos.filter(event => event.id !== eventId),
          updatedAt: new Date().toISOString(),
        };
      }
      return record;
    });

    setDailyRecords(updatedRecords);
    localStorage.setItem('acasa_agravos_daily_records', JSON.stringify(updatedRecords));
  };

  const calculateMonthlyIndicators = (month: number, year: number, unit: string, populacaoBase: number): MonthlyAgravosIndicators => {
    const monthRecords = getDailyRecordsForMonth(month, year, unit);
    
    // Somar todos os agravos do mês
    const totals = monthRecords.reduce((acc, record) => ({
      totalQuedaComLesao: acc.totalQuedaComLesao + record.quedaComLesao,
      totalQuedaSemLesao: acc.totalQuedaSemLesao + record.quedaSemLesao,
      totalLesaoPorPressao: acc.totalLesaoPorPressao + record.lesaoPorPressao,
      totalDiarreia: acc.totalDiarreia + record.diarreia,
      totalEscabiose: acc.totalEscabiose + record.escabiose,
      totalDesidratacao: acc.totalDesidratacao + record.desidratacao,
      totalObito: acc.totalObito + record.obito,
      totalTentativaSuicidio: acc.totalTentativaSuicidio + record.tentativaSuicidio,
    }), {
      totalQuedaComLesao: 0,
      totalQuedaSemLesao: 0,
      totalLesaoPorPressao: 0,
      totalDiarreia: 0,
      totalEscabiose: 0,
      totalDesidratacao: 0,
      totalObito: 0,
      totalTentativaSuicidio: 0,
    });

    // Calcular indicadores conforme fórmulas padrão
    const indicators: MonthlyAgravosIndicators = {
      id: `${unit}-${month}-${year}`,
      unit,
      month,
      year,
      populacaoBase,
      ...totals,
      
      // Fórmulas dos indicadores (por 1000 residentes/mês)
      taxaMortalidade: populacaoBase > 0 ? (totals.totalObito / populacaoBase) * 1000 : 0,
      taxaIncidenciaDiarreia: populacaoBase > 0 ? (totals.totalDiarreia / populacaoBase) * 1000 : 0,
      taxaIncidenciaEscabiose: populacaoBase > 0 ? (totals.totalEscabiose / populacaoBase) * 1000 : 0,
      taxaIncidenciaDesidratacao: populacaoBase > 0 ? (totals.totalDesidratacao / populacaoBase) * 1000 : 0,
      taxaPrevalenciaLesaoPressao: populacaoBase > 0 ? (totals.totalLesaoPorPressao / populacaoBase) * 1000 : 0,
      
      calculatedAt: new Date().toISOString(),
    };

    // Salvar indicadores
    const updatedIndicators = monthlyIndicators.filter(ind => 
      !(ind.unit === unit && ind.month === month && ind.year === year)
    );
    updatedIndicators.push(indicators);
    setMonthlyIndicators(updatedIndicators);
    localStorage.setItem('acasa_agravos_monthly_indicators', JSON.stringify(updatedIndicators));

    return indicators;
  };

  const generateAnnualSummary = (year: number, unit: string): AnnualAgravosSummary => {
    const yearIndicators = monthlyIndicators.filter(ind => ind.year === year && ind.unit === unit);
    
    // Somar totais anuais
    const annualTotals = yearIndicators.reduce((acc, indicator) => ({
      totalQuedaComLesao: acc.totalQuedaComLesao + indicator.totalQuedaComLesao,
      totalQuedaSemLesao: acc.totalQuedaSemLesao + indicator.totalQuedaSemLesao,
      totalLesaoPorPressao: acc.totalLesaoPorPressao + indicator.totalLesaoPorPressao,
      totalDiarreia: acc.totalDiarreia + indicator.totalDiarreia,
      totalEscabiose: acc.totalEscabiose + indicator.totalEscabiose,
      totalDesidratacao: acc.totalDesidratacao + indicator.totalDesidratacao,
      totalObito: acc.totalObito + indicator.totalObito,
      totalTentativaSuicidio: acc.totalTentativaSuicidio + indicator.totalTentativaSuicidio,
    }), {
      totalQuedaComLesao: 0,
      totalQuedaSemLesao: 0,
      totalLesaoPorPressao: 0,
      totalDiarreia: 0,
      totalEscabiose: 0,
      totalDesidratacao: 0,
      totalObito: 0,
      totalTentativaSuicidio: 0,
    });

    // Calcular médias anuais
    const monthsWithData = yearIndicators.length;
    const averages = monthsWithData > 0 ? {
      mediaAnualMortalidade: yearIndicators.reduce((sum, ind) => sum + ind.taxaMortalidade, 0) / monthsWithData,
      mediaAnualIncidenciaDiarreia: yearIndicators.reduce((sum, ind) => sum + ind.taxaIncidenciaDiarreia, 0) / monthsWithData,
      mediaAnualIncidenciaEscabiose: yearIndicators.reduce((sum, ind) => sum + ind.taxaIncidenciaEscabiose, 0) / monthsWithData,
      mediaAnualIncidenciaDesidratacao: yearIndicators.reduce((sum, ind) => sum + ind.taxaIncidenciaDesidratacao, 0) / monthsWithData,
      mediaAnualPrevalenciaLesaoPressao: yearIndicators.reduce((sum, ind) => sum + ind.taxaPrevalenciaLesaoPressao, 0) / monthsWithData,
    } : {
      mediaAnualMortalidade: 0,
      mediaAnualIncidenciaDiarreia: 0,
      mediaAnualIncidenciaEscabiose: 0,
      mediaAnualIncidenciaDesidratacao: 0,
      mediaAnualPrevalenciaLesaoPressao: 0,
    };

    const summary: AnnualAgravosSummary = {
      id: `${unit}-${year}`,
      unit,
      year,
      ...annualTotals,
      ...averages,
      monthlyData: yearIndicators.sort((a, b) => a.month - b.month),
      generatedAt: new Date().toISOString(),
    };

    // Salvar summary
    const updatedSummaries = annualSummaries.filter(sum => 
      !(sum.unit === unit && sum.year === year)
    );
    updatedSummaries.push(summary);
    setAnnualSummaries(updatedSummaries);
    localStorage.setItem('acasa_agravos_annual_summaries', JSON.stringify(updatedSummaries));

    return summary;
  };

  const getMonthlyIndicators = (month: number, year: number, unit: string) => {
    return monthlyIndicators.find(ind => 
      ind.month === month && ind.year === year && ind.unit === unit
    );
  };

  const getFrequentAgravoAlerts = (): AgravoAlert[] => {
    const alerts: AgravoAlert[] = [];
    const lastWeekRecords = dailyRecords.filter(record => {
      const recordDate = new Date(record.date);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return recordDate >= oneWeekAgo;
    });

    // Analisar quedas frequentes
    const totalQuedas = lastWeekRecords.reduce((sum, record) => 
      sum + record.quedaComLesao + record.quedaSemLesao, 0
    );
    
    if (totalQuedas >= 5) {
      const affectedResidents = lastWeekRecords
        .flatMap(record => record.eventos)
        .filter(event => event.tipo.includes('Queda'))
        .map(event => event.residenteNome);
      
      alerts.push({
        type: 'Quedas Frequentes',
        frequency: totalQuedas,
        lastOccurrence: lastWeekRecords[lastWeekRecords.length - 1]?.date || '',
        affectedResidents: [...new Set(affectedResidents)],
        message: `${totalQuedas} quedas registradas na última semana`,
        severity: totalQuedas >= 10 ? 'high' : 'medium',
      });
    }

    // Analisar lesões por pressão
    const totalLesoes = lastWeekRecords.reduce((sum, record) => sum + record.lesaoPorPressao, 0);
    if (totalLesoes >= 3) {
      const affectedResidents = lastWeekRecords
        .flatMap(record => record.eventos)
        .filter(event => event.tipo === 'Lesão por pressão')
        .map(event => event.residenteNome);

      alerts.push({
        type: 'Lesões por Pressão',
        frequency: totalLesoes,
        lastOccurrence: lastWeekRecords[lastWeekRecords.length - 1]?.date || '',
        affectedResidents: [...new Set(affectedResidents)],
        message: `${totalLesoes} lesões por pressão na última semana`,
        severity: 'high',
      });
    }

    return alerts;
  };

  const value = {
    dailyRecords,
    monthlyIndicators,
    annualSummaries,
    addDailyRecord,
    updateDailyRecord,
    getDailyRecord,
    getDailyRecordsForMonth,
    addEvent,
    updateEvent,
    removeEvent,
    calculateMonthlyIndicators,
    generateAnnualSummary,
    getMonthlyIndicators,
    getFrequentAgravoAlerts,
    loading,
    error,
  };

  return <AgravosContext.Provider value={value}>{children}</AgravosContext.Provider>;
};