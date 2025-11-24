export interface DailyAgravosRecord {
  id: string;
  unit: 'Botafogo';
  date: string; // YYYY-MM-DD
  month: number;
  year: number;
  
  // Agravos com contadores
  quedaComLesao: number;
  quedaSemLesao: number;
  lesaoPorPressao: number;
  diarreia: number;
  escabiose: number;
  desidratacao: number;
  obito: number;
  tentativaSuicidio: number;
  
  // Observações obrigatórias se houver evento
  observacoes: string;
  
  // Detalhes dos eventos (array de eventos específicos)
  eventos: AgravoEvent[];
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgravoEvent {
  id: string;
  tipo: 'Queda com lesão' | 'Queda sem lesão' | 'Lesão por pressão' | 'Diarreia' | 'Escabiose' | 'Desidratação' | 'Óbito' | 'Tentativa de suicídio';
  data: string;
  residenteNome: string;
  residenteId?: string;
  descricao: string;
  condutaAdotada: string;
  resolucao: string;
  responsavel: string;
  horario?: string;
}

export interface MonthlyAgravosIndicators {
  id: string;
  unit: 'Botafogo';
  month: number;
  year: number;
  
  // Base populacional
  populacaoBase: number; // Número de residentes no dia 15
  
  // Indicadores calculados
  taxaMortalidade: number;
  taxaIncidenciaDiarreia: number;
  taxaIncidenciaEscabiose: number;
  taxaIncidenciaDesidratacao: number;
  taxaPrevalenciaLesaoPressao: number;
  taxaPrevalenciaDesnutricao?: number;
  
  // Totais do mês
  totalQuedaComLesao: number;
  totalQuedaSemLesao: number;
  totalLesaoPorPressao: number;
  totalDiarreia: number;
  totalEscabiose: number;
  totalDesidratacao: number;
  totalObito: number;
  totalTentativaSuicidio: number;
  
  calculatedAt: string;
}

export interface AnnualAgravosSummary {
  id: string;
  unit: 'Botafogo';
  year: number;
  
  // Totais anuais por tipo
  totalQuedaComLesao: number;
  totalQuedaSemLesao: number;
  totalLesaoPorPressao: number;
  totalDiarreia: number;
  totalEscabiose: number;
  totalDesidratacao: number;
  totalObito: number;
  totalTentativaSuicidio: number;
  
  // Médias mensais dos indicadores
  mediaAnualMortalidade: number;
  mediaAnualIncidenciaDiarreia: number;
  mediaAnualIncidenciaEscabiose: number;
  mediaAnualIncidenciaDesidratacao: number;
  mediaAnualPrevalenciaLesaoPressao: number;
  
  // Detalhes mensais
  monthlyData: MonthlyAgravosIndicators[];
  
  generatedAt: string;
}