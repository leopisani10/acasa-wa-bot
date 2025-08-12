import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, getCurrentUserId } from '../utils/supabase';
import { 
  Candidate, 
  CandidateActivity, 
  CandidateFilters, 
  CandidateStatus, 
  CandidateStats,
  PublicCandidateFormData,
  CandidateFormData,
  ActivityFormData 
} from '../types/talentBank';

interface TalentBankContextType {
  // Candidates
  candidates: Candidate[];
  addCandidate: (candidateData: CandidateFormData) => Promise<void>;
  addPublicCandidate: (candidateData: PublicCandidateFormData) => Promise<void>;
  updateCandidate: (id: string, candidateData: Partial<Candidate>) => Promise<void>;
  deleteCandidate: (id: string) => Promise<void>;
  getCandidate: (id: string) => Candidate | undefined;
  updateCandidateStatus: (id: string, status: CandidateStatus) => Promise<void>;
  
  // Activities
  activities: CandidateActivity[];
  addActivity: (activityData: Omit<CandidateActivity, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateActivity: (id: string, activityData: Partial<CandidateActivity>) => Promise<void>;
  completeActivity: (id: string) => Promise<void>;
  getCandidateActivities: (candidateId: string) => CandidateActivity[];
  
  // Filters and search
  filteredCandidates: Candidate[];
  setFilters: (filters: CandidateFilters) => void;
  filters: CandidateFilters;
  
  // Stats and reports
  getStats: () => CandidateStats;
  
  // State
  loading: boolean;
  error: string | null;
}

const TalentBankContext = createContext<TalentBankContextType | undefined>(undefined);

export const useTalentBank = () => {
  const context = useContext(TalentBankContext);
  if (context === undefined) {
    throw new Error('useTalentBank must be used within a TalentBankProvider');
  }
  return context;
};

interface TalentBankProviderProps {
  children: ReactNode;
}

export const TalentBankProvider: React.FC<TalentBankProviderProps> = ({ children }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activities, setActivities] = useState<CandidateActivity[]>([]);
  const [filters, setFilters] = useState<CandidateFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setError(null);
      setLoading(true);
      await Promise.all([
        fetchCandidates(),
        fetchActivities(),
      ]);
    } catch (error) {
      console.log('Some talent bank tables are missing - this is expected if migration has not been run');
      
      // Check if error is related to missing tables
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'PGRST205' || error.code === 'PGRST116') {
          setError('CONFIGURAÇÃO NECESSÁRIA: As tabelas do Banco de Talentos ainda não foram criadas. Acesse o Supabase SQL Editor e execute a migração "create_talent_bank_tables.sql" para ativar este módulo.');
        } else if (error.code === '42P01') {
          setError('TABELAS AUSENTES: Execute a migração "create_talent_bank_tables.sql" no Supabase SQL Editor para criar as tabelas necessárias do Banco de Talentos.');
        } else {
          setError(`Erro no banco de dados: ${error.message || 'Erro desconhecido'}`);
        }
      } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setError('Erro de conexão: Verifique sua conexão com a internet e se o Supabase está configurado corretamente');
      } else {
        setError('MIGRAÇÃO PENDENTE: As tabelas do Banco de Talentos precisam ser criadas. Execute a migração "create_talent_bank_tables.sql" no Supabase SQL Editor.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      // Wrap in try-catch to prevent Supabase SDK console errors
      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          // Check for table not found errors
          if (error.code === 'PGRST205' || error.code === 'PGRST116' || error.code === '42P01') {
            setCandidates([]);
            return;
          }
          throw error;
        }
        setCandidates(data || []);
      } catch (err: any) {
        // Silently handle table not found errors
        if (err?.code === 'PGRST205' || err?.code === 'PGRST116' || err?.code === '42P01') {
          setCandidates([]);
          return;
        }
        throw err;
      }
    } catch (error) {
      setCandidates([]);
      
      // Only throw if it's not a "table doesn't exist" error
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'PGRST205' || error.code === 'PGRST116' || error.code === '42P01') {
          // Table doesn't exist - this is expected, don't log as error
          return;
        }
      }
      // Only log actual errors, not missing table errors
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 'PGRST205')) {
        console.error('Error fetching candidates:', error);
      }
      return;
    }
  };

  const fetchActivities = async () => {
    try {
      // Wrap in try-catch to prevent Supabase SDK console errors
      try {
        const { data, error } = await supabase
          .from('candidate_activities')
          .select(`
            *,
            creator:profiles!candidate_activities_created_by_fkey(id, name)
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          // Check for table not found errors
          if (error.code === 'PGRST205' || error.code === 'PGRST116' || error.code === '42P01') {
            setActivities([]);
            return;
          }
          throw error;
        }
        setActivities(data || []);
      } catch (err: any) {
        // Silently handle table not found errors
        if (err?.code === 'PGRST205' || err?.code === 'PGRST116' || err?.code === '42P01') {
          setActivities([]);
          return;
        }
        throw err;
      }
    } catch (error) {
      setActivities([]);
      
      // Only throw if it's not a "table doesn't exist" error
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'PGRST205' || error.code === 'PGRST116' || error.code === '42P01') {
          // Table doesn't exist - this is expected, don't log as error
          return;
        }
      }
      // Only log actual errors, not missing table errors
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 'PGRST205')) {
        console.error('Error fetching candidate activities:', error);
      }
      return;
    }
  };

  const addCandidate = async (candidateData: CandidateFormData) => {
    try {
      const userId = await getCurrentUserId();
      
      const { data, error } = await supabase
        .from('candidates')
        .insert([{
          ...candidateData,
          created_by: userId,
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      await fetchCandidates();
    } catch (error) {
      console.error('Error adding candidate:', error);
      throw error;
    }
  };

  const addPublicCandidate = async (candidateData: PublicCandidateFormData) => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .insert([{
          full_name: candidateData.full_name,
          email: candidateData.email,
          phone: candidateData.phone,
          desired_position: candidateData.desired_position,
          experience_years: candidateData.experience_years,
          city: candidateData.city,
          state: 'RJ', // Default para RJ
          availability: candidateData.availability,
          salary_expectation: candidateData.salary_expectation,
          status: 'Novo' as CandidateStatus,
          source: 'Site/Formulário' as any,
          lgpd_consent: candidateData.lgpd_consent,
          notes: 'Cadastro via formulário público',
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Create welcome activity
      await supabase
        .from('candidate_activities')
        .insert([{
          candidate_id: data.id,
          type: 'Anotação',
          title: 'Candidato cadastrado via site',
          description: 'Novo candidato se cadastrou através do formulário público do site. Realizar triagem inicial.',
          status: 'Pendente',
        }]);
      
      await fetchCandidates();
      await fetchActivities();
    } catch (error) {
      console.error('Error adding public candidate:', error);
      throw error;
    }
  };

  const updateCandidate = async (id: string, candidateData: Partial<Candidate>) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .update(candidateData)
        .eq('id', id);
      
      if (error) throw error;
      await fetchCandidates();
    } catch (error) {
      console.error('Error updating candidate:', error);
      throw error;
    }
  };

  const updateCandidateStatus = async (id: string, status: CandidateStatus) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      // Create status change activity
      const userId = await getCurrentUserId();
      await supabase
        .from('candidate_activities')
        .insert([{
          candidate_id: id,
          type: 'Anotação',
          title: `Status alterado para: ${status}`,
          description: `Status do candidato foi alterado para ${status}`,
          status: 'Concluída',
          completed_at: new Date().toISOString(),
          created_by: userId,
        }]);
      
      await fetchCandidates();
      await fetchActivities();
    } catch (error) {
      console.error('Error updating candidate status:', error);
      throw error;
    }
  };

  const deleteCandidate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchCandidates();
    } catch (error) {
      console.error('Error deleting candidate:', error);
      throw error;
    }
  };

  const getCandidate = (id: string) => {
    return candidates.find(candidate => candidate.id === id);
  };

  const addActivity = async (activityData: Omit<CandidateActivity, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const userId = await getCurrentUserId();
      
      const { error } = await supabase
        .from('candidate_activities')
        .insert([{
          ...activityData,
          created_by: userId,
        }]);
      
      if (error) throw error;
      await fetchActivities();
    } catch (error) {
      console.error('Error adding activity:', error);
      throw error;
    }
  };

  const updateActivity = async (id: string, activityData: Partial<CandidateActivity>) => {
    try {
      const { error } = await supabase
        .from('candidate_activities')
        .update(activityData)
        .eq('id', id);
      
      if (error) throw error;
      await fetchActivities();
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  };

  const completeActivity = async (id: string) => {
    try {
      const { error } = await supabase
        .from('candidate_activities')
        .update({ 
          status: 'Concluída',
          completed_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      await fetchActivities();
    } catch (error) {
      console.error('Error completing activity:', error);
      throw error;
    }
  };

  const getCandidateActivities = (candidateId: string) => {
    return activities
      .filter(activity => activity.candidate_id === candidateId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  // Apply filters to candidates
  const filteredCandidates = candidates.filter(candidate => {
    if (filters.status && candidate.status !== filters.status) return false;
    if (filters.desired_position && candidate.desired_position !== filters.desired_position) return false;
    if (filters.city && candidate.city !== filters.city) return false;
    if (filters.source && candidate.source !== filters.source) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesCandidate = candidate.full_name?.toLowerCase().includes(search) ||
                               candidate.email?.toLowerCase().includes(search) ||
                               candidate.phone?.includes(search) ||
                               candidate.desired_position?.toLowerCase().includes(search);
      if (!matchesCandidate) return false;
    }
    if (filters.created_from) {
      const createdDate = new Date(candidate.created_at).toISOString().split('T')[0];
      if (createdDate < filters.created_from) return false;
    }
    if (filters.created_to) {
      const createdDate = new Date(candidate.created_at).toISOString().split('T')[0];
      if (createdDate > filters.created_to) return false;
    }
    return true;
  });

  const getStats = (): CandidateStats => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const by_status = [
      'Novo', 'Triagem', 'Entrevista Agendada', 'Entrevistado', 
      'Aprovado', 'Contratado', 'Rejeitado', 'Inativo'
    ].map(status => ({
      status: status as CandidateStatus,
      count: candidates.filter(c => c.status === status).length
    }));

    // Group by position
    const positionCounts = candidates.reduce((acc, candidate) => {
      acc[candidate.desired_position] = (acc[candidate.desired_position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const by_position = Object.entries(positionCounts)
      .map(([position, count]) => ({ position, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    // Group by source
    const sourceCounts = candidates.reduce((acc, candidate) => {
      acc[candidate.source] = (acc[candidate.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const by_source = Object.entries(sourceCounts)
      .map(([source, count]) => ({ source: source as any, count }))
      .sort((a, b) => b.count - a.count);

    const recent_candidates = candidates.filter(c => 
      new Date(c.created_at) >= thirtyDaysAgo
    ).length;

    const total_candidates = candidates.length;
    const contracted = candidates.filter(c => c.status === 'Contratado').length;
    const conversion_rate = total_candidates > 0 ? (contracted / total_candidates) * 100 : 0;

    return {
      total_candidates,
      by_status,
      by_position,
      by_source,
      recent_candidates,
      conversion_rate,
    };
  };

  const value = {
    candidates,
    addCandidate,
    addPublicCandidate,
    updateCandidate,
    deleteCandidate,
    getCandidate,
    updateCandidateStatus,
    activities,
    addActivity,
    updateActivity,
    completeActivity,
    getCandidateActivities,
    filteredCandidates,
    setFilters,
    filters,
    getStats,
    loading,
    error,
  };

  return <TalentBankContext.Provider value={value}>{children}</TalentBankContext.Provider>;
};