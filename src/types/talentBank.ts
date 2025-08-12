// Banco de Talentos Module Types

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  desired_position: string;
  experience_years: number;
  curriculum_url?: string;
  city?: string;
  state: string;
  availability?: string; // Ex: "Imediata", "30 dias", "A combinar"
  salary_expectation?: string;
  status: CandidateStatus;
  source: CandidateSource;
  lgpd_consent: boolean;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Virtual fields
  activities?: CandidateActivity[];
  last_activity?: CandidateActivity;
}

export type CandidateStatus = 
  | 'Novo' 
  | 'Triagem' 
  | 'Entrevista Agendada' 
  | 'Entrevistado' 
  | 'Aprovado' 
  | 'Contratado' 
  | 'Rejeitado' 
  | 'Inativo';

export type CandidateSource = 
  | 'Site/Formulário' 
  | 'Indicação' 
  | 'LinkedIn' 
  | 'WhatsApp' 
  | 'Email' 
  | 'Presencial' 
  | 'Outro';

export interface CandidateActivity {
  id: string;
  candidate_id: string;
  type: ActivityType;
  title: string;
  description?: string;
  scheduled_at?: string;
  completed_at?: string;
  status: ActivityStatus;
  created_by?: string;
  created_at: string;
  // Virtual fields
  creator?: { id: string; name: string; };
}

export type ActivityType = 
  | 'Ligação' 
  | 'Email' 
  | 'WhatsApp' 
  | 'Entrevista' 
  | 'Tarefa' 
  | 'Anotação';

export type ActivityStatus = 
  | 'Pendente' 
  | 'Em Andamento' 
  | 'Concluída' 
  | 'Cancelada';

// Form interfaces
export interface PublicCandidateFormData {
  full_name: string;
  email: string;
  phone: string;
  desired_position: string;
  experience_years: number;
  city: string;
  availability: string;
  salary_expectation: string;
  lgpd_consent: boolean;
}

export interface CandidateFormData {
  full_name: string;
  email: string;
  phone: string;
  desired_position: string;
  experience_years: number;
  curriculum_url: string;
  city: string;
  state: string;
  availability: string;
  salary_expectation: string;
  status: CandidateStatus;
  source: CandidateSource;
  notes: string;
}

export interface ActivityFormData {
  type: ActivityType;
  title: string;
  description: string;
  scheduled_at: string;
  status: ActivityStatus;
}

// Filter interfaces
export interface CandidateFilters {
  status?: CandidateStatus;
  desired_position?: string;
  city?: string;
  source?: CandidateSource;
  search?: string;
  created_from?: string;
  created_to?: string;
}

// Report interfaces
export interface CandidateStats {
  total_candidates: number;
  by_status: { status: CandidateStatus; count: number; }[];
  by_position: { position: string; count: number; }[];
  by_source: { source: CandidateSource; count: number; }[];
  recent_candidates: number; // últimos 30 dias
  conversion_rate: number; // % de contratados
}

// Pipeline configuration
export const CANDIDATE_STATUSES: { 
  value: CandidateStatus; 
  label: string; 
  color: string; 
  bgColor: string; 
  textColor: string;
  description: string;
}[] = [
  {
    value: 'Novo',
    label: 'Novo',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    description: 'Candidato recém-cadastrado, aguardando triagem',
  },
  {
    value: 'Triagem',
    label: 'Triagem',
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    description: 'Em processo de análise de perfil e documentação',
  },
  {
    value: 'Entrevista Agendada',
    label: 'Entrevista Agendada',
    color: 'purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    description: 'Entrevista marcada com data e horário definidos',
  },
  {
    value: 'Entrevistado',
    label: 'Entrevistado',
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    description: 'Entrevista realizada, aguardando decisão',
  },
  {
    value: 'Aprovado',
    label: 'Aprovado',
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    description: 'Candidato aprovado, aguardando contratação',
  },
  {
    value: 'Contratado',
    label: 'Contratado',
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    description: 'Candidato contratado e admitido na empresa',
  },
  {
    value: 'Rejeitado',
    label: 'Rejeitado',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    description: 'Candidato não aprovado no processo seletivo',
  },
  {
    value: 'Inativo',
    label: 'Inativo',
    color: 'gray',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    description: 'Candidato inativo ou que desistiu do processo',
  },
];

export const ACTIVITY_TYPES_TALENT = [
  { value: 'Ligação', label: 'Ligação', icon: 'Phone', color: 'blue' },
  { value: 'Email', label: 'Email', icon: 'Mail', color: 'green' },
  { value: 'WhatsApp', label: 'WhatsApp', icon: 'MessageCircle', color: 'green' },
  { value: 'Entrevista', label: 'Entrevista', icon: 'Video', color: 'purple' },
  { value: 'Tarefa', label: 'Tarefa', icon: 'CheckSquare', color: 'orange' },
  { value: 'Anotação', label: 'Anotação', icon: 'FileText', color: 'gray' },
];

export const CANDIDATE_SOURCES = [
  'Site/Formulário',
  'Indicação',
  'LinkedIn',
  'WhatsApp',
  'Email',
  'Presencial',
  'Outro',
];

export const COMMON_POSITIONS = [
  'Enfermeira',
  'Técnico de Enfermagem',
  'Cuidador de Idosos',
  'Auxiliar de Serviços Gerais',
  'Cozinheira',
  'Nutricionista',
  'Fisioterapeuta',
  'Psicóloga',
  'Assistente Social',
  'Administrador',
  'Recepcionista',
  'Segurança',
  'Manutenção',
  'Outro',
];

export const AVAILABILITY_OPTIONS = [
  'Imediata',
  '15 dias',
  '30 dias',
  '60 dias',
  'A combinar',
];

// Helper functions
export const getStatusConfig = (status: CandidateStatus) => {
  return CANDIDATE_STATUSES.find(s => s.value === status) || CANDIDATE_STATUSES[0];
};

export const getActivityTypeConfig = (type: string) => {
  return ACTIVITY_TYPES_TALENT.find(t => t.value === type) || ACTIVITY_TYPES_TALENT[0];
};

export const formatCandidatePhone = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

export const isValidCandidatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
};

export const calculateDaysInPipeline = (createdAt: string): number => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};