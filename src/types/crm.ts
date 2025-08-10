// CRM Module Types

export interface Unit {
  id: string;
  name: string;
  created_at: string;
}

export interface Contact {
  id: string;
  unit_id?: string;
  full_name?: string;
  relation?: string; // filho, neto, etc.
  phone?: string;
  email?: string;
  neighborhood?: string;
  notes?: string;
  lgpd_consent: boolean;
  lgpd_consent_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Virtual fields
  unit?: Unit;
}

export interface Lead {
  id: string;
  contact_id?: string;
  stage: LeadStage;
  source: string;
  owner_id?: string;
  diagnosis?: string;
  dependency_grade?: 'I' | 'II' | 'III';
  elderly_age?: number;
  elderly_name?: string;
  value_band?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Virtual fields
  contact?: Contact;
  owner?: { id: string; name: string; };
  activities?: Activity[];
  last_activity?: Activity;
}

export type LeadStage = 
  | 'Novo' 
  | 'Qualificando' 
  | 'Agendou visita' 
  | 'Visitou' 
  | 'Proposta' 
  | 'Fechado' 
  | 'Perdido';

export interface Activity {
  id: string;
  lead_id: string;
  type: 'call' | 'visit' | 'msg' | 'task';
  title: string;
  description?: string;
  due_at?: string;
  done: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Virtual fields
  creator?: { id: string; name: string; };
}

export interface WhatsAppMessage {
  id: string;
  lead_id: string;
  wa_from: string;
  wa_to: string;
  direction: 'inbound' | 'outbound';
  body: string;
  wa_msg_id: string;
  created_at: string;
}

// Form interfaces
export interface ContactFormData {
  full_name: string;
  relation: string;
  phone: string;
  email: string;
  neighborhood: string;
  unit_id: string;
  lgpd_consent: boolean;
  notes: string;
}

export interface LeadFormData {
  elderly_name: string;
  elderly_age: number;
  diagnosis: string;
  dependency_grade: 'I' | 'II' | 'III';
  value_band: string;
  stage: LeadStage;
  owner_id: string;
  source: string;
}

export interface ActivityFormData {
  type: 'call' | 'visit' | 'msg' | 'task';
  title: string;
  description: string;
  due_at: string;
}

// Filter interfaces
export interface LeadFilters {
  stage?: LeadStage;
  unit_id?: string;
  owner_id?: string;
  search?: string;
  created_from?: string;
  created_to?: string;
}

// Report interfaces
export interface LeadStageStats {
  stage: LeadStage;
  count: number;
  percentage: number;
}

export interface ConversionStats {
  total_leads: number;
  visited: number;
  proposals: number;
  closed: number;
  visit_rate: number;
  proposal_rate: number;
  close_rate: number;
}

export interface CRMReportData {
  stage_stats: LeadStageStats[];
  conversion_stats: ConversionStats;
  recent_activities: Activity[];
  top_sources: { source: string; count: number; }[];
  period_summary: {
    new_leads: number;
    closed_deals: number;
    lost_deals: number;
    in_progress: number;
  };
}

// Pipeline configuration
export const LEAD_STAGES: { 
  value: LeadStage; 
  label: string; 
  color: string; 
  bgColor: string; 
  textColor: string;
}[] = [
  {
    value: 'Novo',
    label: 'Novo',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  {
    value: 'Qualificando',
    label: 'Qualificando',
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
  },
  {
    value: 'Agendou visita',
    label: 'Agendou visita',
    color: 'purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
  },
  {
    value: 'Visitou',
    label: 'Visitou',
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
  },
  {
    value: 'Proposta',
    label: 'Proposta',
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
  },
  {
    value: 'Fechado',
    label: 'Fechado',
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
  },
  {
    value: 'Perdido',
    label: 'Perdido',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
  },
];

export const ACTIVITY_TYPES = [
  { value: 'call', label: 'Ligação', icon: 'Phone', color: 'blue' },
  { value: 'visit', label: 'Visita', icon: 'MapPin', color: 'green' },
  { value: 'msg', label: 'Mensagem', icon: 'MessageCircle', color: 'purple' },
  { value: 'task', label: 'Tarefa', icon: 'CheckSquare', color: 'orange' },
];

export const VALUE_BANDS = [
  'Quarto Individual',
  'Quarto Duplo',
  'Quarto Triplo',
  'Apartamento',
  'Suíte Premium',
  'A definir',
];

export const DEPENDENCY_GRADES = [
  { value: 'I', label: 'Grau I - Dependência Leve', description: 'Necessita ajuda em até 2 atividades' },
  { value: 'II', label: 'Grau II - Dependência Moderada', description: 'Necessita ajuda em 3-4 atividades' },
  { value: 'III', label: 'Grau III - Dependência Severa', description: 'Necessita ajuda em 5-6 atividades' },
];

// Helper functions
export const getStageConfig = (stage: LeadStage) => {
  return LEAD_STAGES.find(s => s.value === stage) || LEAD_STAGES[0];
};

export const getActivityTypeConfig = (type: string) => {
  return ACTIVITY_TYPES.find(t => t.value === type) || ACTIVITY_TYPES[0];
};

export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

export const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
};