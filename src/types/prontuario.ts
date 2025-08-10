export interface MedicalRecord {
  id: string;
  guestId: string;
  guestName: string; // Cache para performance
  recordDate: string; // YYYY-MM-DD
  shiftType: 'SD' | 'SN'; // Serviço Diurno ou Serviço Noturno
  technicalResponsible: string; // Nome do técnico
  technicalResponsibleId: string; // ID do usuário técnico
  
  // Sinais Vitais
  vitalSigns: VitalSign[];
  
  // Avaliações Clínicas
  clinicalAssessment: ClinicalAssessment;
  
  // Observações e Intercorrências
  observations: string;
  intercurrences: string;
  
  // Assinatura Digital
  digitalSignature: DigitalSignature;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  unit: 'Botafogo' | 'Tijuca';
  
  // Controle de edição
  isLocked: boolean; // true após assinatura
  lastEditBy: string;
  lastEditAt: string;
}

export interface VitalSign {
  id: string;
  time: string; // HH:MM
  bloodPressure: string; // PA - Ex: "120x80"
  heartRate: number; // FC
  respiratoryRate: number; // FR
  temperature: number; // TAX
  oxygenSaturation: number; // SatO2
  capillaryGlycemia: number; // Glicemia Capilar
  painScale: number; // Escala de dor 0-10
  notes?: string; // Observações específicas
}

export interface ClinicalAssessment {
  // Nível de Consciência
  consciousnessLevel: 'Lúcido' | 'Orientado' | 'Algo orientado' | 'Irresponsivo';
  
  // Aparelho Locomotor
  locomotorApparatus: 'Deambulando' | 'Com auxílio' | 'Acamado';
  
  // Alimentação
  feeding: {
    route: 'Oral' | 'Gastrostomia' | 'Jejunostomia';
    dietType: 'Pastosa' | 'Branda';
    thickener: boolean;
  };
  
  // Lesão por Pressão
  pressureInjury: {
    present: boolean;
    dressing: boolean;
    location?: string;
    stage?: string;
    description?: string;
  };
  
  // Eliminação Vesico-Intestinal
  elimination: {
    normal: boolean;
    alteration?: string;
    details?: string;
  };
  
  // Alergia
  allergy: {
    present: boolean;
    description?: string;
    medications?: string;
  };
}

export interface DigitalSignature {
  signedAt: string; // ISO timestamp
  signatureType: 'digital_certificate' | 'institutional'; // Tipo de assinatura
  signerCpf: string;
  signerName: string;
  signerRegistry?: string; // COREN, etc.
  institutionStamp: string; // Carimbo da instituição
  hash: string; // Hash da assinatura para verificação
  isValid: boolean;
}

// NOVOS TIPOS PARA SISTEMA MULTIDISCIPLINAR

export interface MultidisciplinaryRecord {
  id: string;
  guestId: string;
  guestName: string;
  specialty: 'Medicina' | 'Enfermagem' | 'Técnico de Enfermagem' | 'Fisioterapia' | 'Fonoaudiologia' | 'Psicologia' | 'Nutrição' | 'Serviço Social';
  recordDate: string;
  professionalId: string;
  professionalName: string;
  professionalRegistry?: string; // CRM, COREN, etc.
  
  // Conteúdo específico por especialidade
  content: MedicalContent | NursingContent | PhysiotherapyContent | SpeechTherapyContent | PsychologyContent | NutritionContent | SocialServiceContent;
  
  // Controle
  isLocked: boolean;
  digitalSignature?: DigitalSignature;
  createdAt: string;
  updatedAt: string;
}

// Anotação Médica
export interface MedicalContent {
  type: 'medical';
  clinicalHistory: string;
  physicalExamination: string;
  diagnosis: string;
  treatment: string;
  prescriptions: Prescription[];
  observations: string;
  followUpDate?: string;
}

export interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

// Anotação de Enfermagem (existente, melhorada)
export interface EnfermagemContent {
  type: 'nursing';
  vitalSigns: VitalSign[];
  clinicalAssessment: ClinicalAssessment;
  nursingDiagnosis: string[];
  interventions: string[];
  patientResponse: string;
  observations: string;
  intercurrences: string;
}

// Anotação de Técnico de Enfermagem
export interface TecnicoEnfermagemContent {
  type: 'tecnico_enfermagem';
  vitalSigns: VitalSign[];
  clinicalAssessment: ClinicalAssessment;
  observations: string;
  intercurrences: string;
}

// Anotação de Fisioterapia
export interface PhysiotherapyContent {
  type: 'physiotherapy';
  functionalAssessment: {
    mobility: 'Independente' | 'Assistido' | 'Dependente';
    balance: 'Bom' | 'Regular' | 'Comprometido';
    strength: 'Normal' | 'Diminuída' | 'Ausente';
    coordination: 'Normal' | 'Alterada';
    pain: number; // 0-10
    painLocation?: string;
  };
  exercises: Exercise[];
  progress: string;
  goals: string[];
  recommendations: string;
  nextSession?: string;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  repetitions: string;
  duration: string;
  observations: string;
}

// Anotação de Fonoaudiologia
export interface SpeechTherapyContent {
  type: 'speech_therapy';
  swallowingAssessment: {
    consistency: 'Normal' | 'Líquido' | 'Pastoso' | 'Sólido';
    difficulty: boolean;
    aspiration: boolean;
    coughing: boolean;
  };
  communicationAssessment: {
    speech: 'Normal' | 'Alterada' | 'Ausente';
    understanding: 'Normal' | 'Alterada' | 'Comprometida';
    expression: 'Normal' | 'Alterada' | 'Comprometida';
  };
  interventions: string[];
  progress: string;
  recommendations: string;
  nextSession?: string;
}

// Anotação de Psicologia
export interface PsychologyContent {
  type: 'psychology';
  mentalState: {
    mood: 'Eutímico' | 'Deprimido' | 'Ansioso' | 'Agitado' | 'Confuso';
    cognition: 'Preservada' | 'Leve Comprometimento' | 'Moderado Comprometimento' | 'Grave Comprometimento';
    orientation: 'Orientado' | 'Desorientado Temporal' | 'Desorientado Espacial' | 'Desorientado Pessoa';
    memory: 'Preservada' | 'Comprometida';
  };
  behavioralObservations: string;
  interventions: string[];
  familyInteraction: string;
  recommendations: string;
  nextSession?: string;
}

// Anotação de Nutrição
export interface NutritionContent {
  type: 'nutrition';
  nutritionalAssessment: {
    appetite: 'Bom' | 'Regular' | 'Diminuído' | 'Ausente';
    hydration: 'Adequada' | 'Insuficiente' | 'Excessiva';
    weight: number;
    height: number;
    bmi: number;
    swallowing: 'Normal' | 'Comprometida';
  };
  dietPlan: {
    type: 'Branda' | 'Pastosa' | 'Líquida' | 'Diabética' | 'Hipolipídica' | 'Hipossódica';
    calories: number;
    restrictions: string[];
    supplements: string[];
  };
  acceptance: 'Boa' | 'Regular' | 'Ruim';
  observations: string;
  recommendations: string;
}

// Anotação de Serviço Social
export interface SocialServiceContent {
  type: 'social_service';
  familyAssessment: {
    familyStructure: string;
    socialSupport: 'Adequado' | 'Limitado' | 'Ausente';
    financialSituation: 'Estável' | 'Limitada' | 'Comprometida';
    familyDynamics: string;
  };
  socialNeeds: string[];
  interventions: string[];
  resources: string[];
  followUp: string;
  nextVisit?: string;
}

// Filtros e busca
export interface MedicalRecordFilter {
  dateFrom?: string;
  dateTo?: string;
  author?: string;
  keyword?: string;
  shiftType?: 'SD' | 'SN' | 'all';
  specialty?: string;
}

export interface MedicalRecordSummary {
  totalRecords: number;
  recordsByShift: {
    SD: number;
    SN: number;
  };
  recordsBySpecialty: Record<string, number>;
  recordsByTechnical: Record<string, number>;
  dateRange: {
    first: string;
    last: string;
  };
}

// Permissões por cargo
export type UserRole = 'Médico' | 'Enfermeira' | 'Técnico de Enfermagem' | 'Fisioterapeuta' | 'Fonoaudióloga' | 'Psicóloga' | 'Nutricionista' | 'Assistente Social' | 'Administrador';

export interface Permission {
  canRead: string[]; // Especialidades que pode ler
  canWrite: string[]; // Especialidades que pode escrever
  canEditOwn: boolean; // Pode editar próprias anotações
  canSign: boolean; // Pode assinar digitalmente
}

export const USER_PERMISSIONS: Record<UserRole, Permission> = {
  'Médico': {
    canRead: ['Medicina', 'Enfermagem', 'Técnico de Enfermagem', 'Fisioterapia', 'Fonoaudiologia', 'Psicologia', 'Nutrição', 'Serviço Social'],
    canWrite: ['Medicina'],
    canEditOwn: true,
    canSign: true,
  },
  'Enfermeira': {
    canRead: ['Medicina', 'Enfermagem', 'Técnico de Enfermagem', 'Fisioterapia', 'Fonoaudiologia', 'Psicologia', 'Nutrição', 'Serviço Social'],
    canWrite: ['Enfermagem'],
    canEditOwn: true,
    canSign: true,
  },
  'Técnico de Enfermagem': {
    canRead: ['Medicina', 'Enfermagem', 'Técnico de Enfermagem', 'Fisioterapia', 'Fonoaudiologia', 'Psicologia', 'Nutrição', 'Serviço Social'],
    canWrite: ['Técnico de Enfermagem'],
    canEditOwn: true,
    canSign: true,
  },
  'Fisioterapeuta': {
    canRead: ['Medicina', 'Enfermagem', 'Técnico de Enfermagem', 'Fisioterapia', 'Fonoaudiologia', 'Psicologia', 'Nutrição', 'Serviço Social'],
    canWrite: ['Fisioterapia'],
    canEditOwn: true,
    canSign: true,
  },
  'Fonoaudióloga': {
    canRead: ['Medicina', 'Enfermagem', 'Técnico de Enfermagem', 'Fisioterapia', 'Fonoaudiologia', 'Psicologia', 'Nutrição', 'Serviço Social'],
    canWrite: ['Fonoaudiologia'],
    canEditOwn: true,
    canSign: true,
  },
  'Psicóloga': {
    canRead: ['Medicina', 'Enfermagem', 'Técnico de Enfermagem', 'Fisioterapia', 'Fonoaudiologia', 'Psicologia', 'Nutrição', 'Serviço Social'],
    canWrite: ['Psicologia'],
    canEditOwn: true,
    canSign: true,
  },
  'Nutricionista': {
    canRead: ['Medicina', 'Enfermagem', 'Técnico de Enfermagem', 'Fisioterapia', 'Fonoaudiologia', 'Psicologia', 'Nutrição', 'Serviço Social'],
    canWrite: ['Nutrição'],
    canEditOwn: true,
    canSign: true,
  },
  'Assistente Social': {
    canRead: ['Medicina', 'Enfermagem', 'Técnico de Enfermagem', 'Fisioterapia', 'Fonoaudiologia', 'Psicologia', 'Nutrição', 'Serviço Social'],
    canWrite: ['Serviço Social'],
    canEditOwn: true,
    canSign: true,
  },
  'Administrador': {
    canRead: ['Medicina', 'Enfermagem', 'Técnico de Enfermagem', 'Fisioterapia', 'Fonoaudiologia', 'Psicologia', 'Nutrição', 'Serviço Social'],
    canWrite: ['Medicina', 'Enfermagem', 'Técnico de Enfermagem', 'Fisioterapia', 'Fonoaudiologia', 'Psicologia', 'Nutrição', 'Serviço Social'],
    canEditOwn: true,
    canSign: true,
  },
};

export const SPECIALTY_CONFIG = {
  'Medicina': {
    name: 'Medicina',
    icon: 'Stethoscope',
    color: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    buttonColor: 'bg-red-600 hover:bg-red-700',
  },
  'Enfermagem': {
    name: 'Enfermagem',
    icon: 'Heart',
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
  },
  'Técnico de Enfermagem': {
    name: 'Técnico de Enfermagem',
    icon: 'Activity',
    color: 'teal',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-700',
    buttonColor: 'bg-teal-600 hover:bg-teal-700',
  },
  'Fisioterapia': {
    name: 'Fisioterapia',
    icon: 'Zap',
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    buttonColor: 'bg-green-600 hover:bg-green-700',
  },
  'Fonoaudiologia': {
    name: 'Fonoaudiologia',
    icon: 'Mic',
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    buttonColor: 'bg-purple-600 hover:bg-purple-700',
  },
  'Psicologia': {
    name: 'Psicologia',
    icon: 'Brain',
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
  },
  'Nutrição': {
    name: 'Nutrição',
    icon: 'Apple',
    color: 'orange',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    buttonColor: 'bg-orange-600 hover:bg-orange-700',
  },
  'Serviço Social': {
    name: 'Serviço Social',
    icon: 'Users',
    color: 'pink',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-700',
    buttonColor: 'bg-pink-600 hover:bg-pink-700',
  },
};

// Helper para mapear cargo do usuário para especialidade
export const mapPositionToSpecialty = (position: string): string => {
  const positionLower = position.toLowerCase();
  
  if (positionLower.includes('médico') || positionLower.includes('medico')) return 'Medicina';
  if (positionLower.includes('enfermeira') || positionLower.includes('enfermeiro')) return 'Enfermagem';
  if (positionLower.includes('técnico de enfermagem') || positionLower.includes('tecnico de enfermagem')) return 'Técnico de Enfermagem';
  if (positionLower.includes('fisioterapeuta') || positionLower.includes('fisio')) return 'Fisioterapia';
  if (positionLower.includes('fonoaudióloga') || positionLower.includes('fonoaudiologa') || positionLower.includes('fono')) return 'Fonoaudiologia';
  if (positionLower.includes('psicóloga') || positionLower.includes('psicologa') || positionLower.includes('psico')) return 'Psicologia';
  if (positionLower.includes('nutricionista') || positionLower.includes('nutri')) return 'Nutrição';
  if (positionLower.includes('assistente social') || positionLower.includes('social')) return 'Serviço Social';
  
  // Padrão para cargos não mapeados (técnicos)
  return 'Técnico de Enfermagem';
};

// Helper para verificar permissões
export const hasPermission = (userPosition: string, action: 'read' | 'write', specialty: string): boolean => {
  const userRole = mapPositionToSpecialty(userPosition) as UserRole;
  const permissions = USER_PERMISSIONS[userRole] || USER_PERMISSIONS['Técnico de Enfermagem'];
  
  if (action === 'read') {
    return permissions.canRead.includes(specialty);
  } else {
    return permissions.canWrite.includes(specialty);
  }
};