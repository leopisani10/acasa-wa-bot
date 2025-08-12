export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  position: string; // cargo
  unit: string; // unidade
  type: 'matriz' | 'franqueado'; // tipo
}

export interface Guest {
  id: string;
  // Informações Pessoais e Identificação
  fullName: string;
  gender: 'Masculino' | 'Feminino';
  birthDate: string;
  cpf: string;
  rg: string;
  documentIssuer: string;
  photo?: string;
  hasCuratorship: boolean;
  imageUsageAuthorized: boolean;

  // Informações Contratuais e Status
  status: 'Ativo' | 'Inativo';
  admissionDate: string;
  exitDate?: string;
  exitReason?: 'Óbito' | 'Rescisão' | 'Transferência' | 'Outro';
  hasNewContract: boolean;
  contractExpiryDate: string;
  dependencyLevel: 'I' | 'II' | 'III';
  legalResponsibleRelationship: string;
  legalResponsibleCpf: string;
  
  // Informações Completas do Responsável Financeiro
  financialResponsibleName: string;
  financialResponsibleRg: string;
  financialResponsibleCpf: string;
  financialResponsibleMaritalStatus: 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)' | 'União Estável';
  financialResponsiblePhone: string;
  financialResponsibleEmail: string;
  financialResponsibleAddress: string;
  financialResponsibleProfession: string;
  unit: 'Botafogo' | 'Tijuca';

  // Taxas
  climatizationFee: boolean; // Janeiro, Fevereiro e Março
  maintenanceFee: boolean; // Agosto
  trousseauFee: boolean; // Julho e Setembro
  administrativeFee: boolean; // Agosto e Novembro

  // Acomodação e Cuidados
  roomNumber: string;
  diaperContracted: boolean;
  dailyDiaperQuantity: number;

  // Plano de Saúde e Serviços de Saúde
  healthPlan?: string;
  hasPhysiotherapy: boolean;
  hasSpeechTherapy: boolean;
  pia?: string; // Plano Individual de Atendimento
  paisi?: string; // Plano de Atenção Integral à Saúde Individual
  digitalizedContract?: string;

  // Vacinas
  vaccinationUpToDate: boolean;
  vaccines: Vaccine[];

  createdAt: string;
  updatedAt: string;
}

export interface Vaccine {
  id: string;
  type: 'COVID-19' | 'Influenza' | 'Hepatite B' | 'Pneumonia' | 'Outras';
  applicationDate: string;
  notes?: string;
}

export interface DocumentTemplate {
  id: string;
  category: 'Contrato' | 'Formulário' | 'Política' | 'Procedimento' | 'Manual' | 'Outro';
  name: string;
  description: string;
  fileType: 'PDF' | 'DOC' | 'DOCX' | 'XLS' | 'XLSX' | 'PPT' | 'PPTX' | 'TXT' | 'Outro';
  attachment?: string; // URL do arquivo
  lastRevisionDate: string;
  lastRevisionResponsible: string;
  status: 'Ativo' | 'Inativo' | 'Em Revisão' | 'Aguardando Aprovação';
  revisionPeriodicity: 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual' | 'Bianual' | 'Conforme Necessário';
  internalNotes: string;
  revisionHistory: DocumentRevision[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRevision {
  id: string;
  revisionDate: string;
  responsible: string;
  changes: string;
  version: string;
  previousAttachment?: string;
  newAttachment?: string;
}

export interface Certificate {
  id: string;
  service: 'Dedetização' | 'Limpeza de Caixa d\'Água' | 'Manutenção de Elevador' | 'Laudo Elétrico' | 'AVCB' | 'Alvará Sanitário' | 'Laudo de Segurança' | 'Outro';
  unit: 'Botafogo' | 'Tijuca';
  executedDate: string;
  expiryDate: string;
  status: 'Em dia' | 'Pendente' | 'Atrasado';
  currentCertificate?: string; // URL do arquivo
  responsible: string;
  lastUpdate: string; // automático
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  // Campos sempre visíveis
  fullName: string;
  cpf: string;
  rg: string;
  birthDate: string;
  address: string;
  position: string; // cargo
  unit: 'Botafogo' | 'Tijuca';
  status: 'Ativo' | 'Inativo' | 'Afastado' | 'Férias';
  photo?: string;
  covidVaccines: CovidVaccine[];
  observations?: string;
  professionalLicense?: ProfessionalLicense;
  
  // Tipo de vínculo (condiciona outros campos)
  employmentType: 'CLT' | 'Contrato' | 'Terceirizado' | 'Estágio' | 'Outro';
  
  // Campos específicos por tipo de vínculo
  cltData?: CLTData;
  contractData?: ContractData;
  outsourcedData?: OutsourcedData;
  
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalLicense {
  council: 'COREN' | 'CRM' | 'CRF' | 'CRESS' | 'CRN' | 'CREFITO' | 'CRA' | 'Outro' | 'Não Possui';
  licenseNumber?: string;
  expiryDate?: string;
}

export interface CovidVaccine {
  id: string;
  dose: '1ª Dose' | '2ª Dose' | '3ª Dose' | 'Reforço' | 'Bivalente';
  vaccineType: 'Pfizer' | 'CoronaVac' | 'AstraZeneca' | 'Janssen' | 'Outro';
  applicationDate: string;
  expiryDate?: string;
  notes?: string;
}

// Campos específicos para CLT
export interface CLTData {
  ctps: string;
  ctpsSeries: string;
  pis: string;
  voterTitle: string;
  voterZone: string;
  voterSection: string;
  medicalExams: MedicalExam[];
  generalVaccines: GeneralVaccine[];
  vacations: Vacation[];
  inssDocument?: string;
  contractAmendment?: string;
  uniformSize?: UniformSize;
}

export interface MedicalExam {
  id: string;
  type: 'ASO' | 'Hemograma' | 'Outro';
  examDate: string;
  expiryDate: string;
  result: 'Apto' | 'Inapto' | 'Apto com Restrições';
  notes?: string;
  attachment?: string;
}

export interface GeneralVaccine {
  id: string;
  type: 'Hepatite B' | 'Influenza' | 'Tétano' | 'Febre Amarela' | 'Outro';
  applicationDate: string;
  expiryDate?: string;
  notes?: string;
}

export interface Vacation {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  period: string; // ex: "2024/2025"
  status: 'Programadas' | 'Em Andamento' | 'Concluídas';
}

export interface UniformSize {
  shirt: 'PP' | 'P' | 'M' | 'G' | 'GG' | 'XG';
  pants: string;
  shoes: string;
  coat?: 'PP' | 'P' | 'M' | 'G' | 'GG' | 'XG';
}

// Campos específicos para Contrato
export interface ContractData {
  signedContract?: string; // link/attachment
  contractStartDate: string;
  contractEndDate: string;
  bankData: BankData;
  profession: string;
  phone: string;
  email: string;
}

export interface BankData {
  bank: string;
  agency: string;
  account: string;
  accountType: 'Corrente' | 'Poupança';
  pix?: string;
}

// Campos específicos para Terceirizado
export interface OutsourcedData {
  companyName: string;
  companyCnpj: string;
  directSupervisor: string;
  serviceType: string;
  contractStartDate: string;
  contractEndDate?: string;
}

export interface NFRDAEntry {
  id: string;
  contractorId: string; // ID do colaborador contratado/terceirizado
  contractorName: string; // Nome do contratado (cache para performance)
  unit: 'Botafogo' | 'Tijuca';
  referenceMonth: number; // 1-12
  referenceYear: number;
  activityReportUpload?: string; // URL do RDA
  invoiceUpload?: string; // URL da NF
  deliveryStatus: 'Aguardando NF/RDA' | 'Sim' | 'Não' | 'Desconto' | 'Congelado' | 'Erro' | 'Sumiu';
  paymentStatus: 'Sim' | 'Não' | 'Parcial' | 'Congelado';
  paymentDate?: string;
  lastUpdate: string; // automático
  createdAt: string;
  updatedAt: string;
}

export interface WorkSchedule {
  id: string;
  employeeId: string;
  scheduleType: 'Geral' | 'Enfermagem' | 'Nutrição';
  unit: 'Botafogo' | 'Tijuca';
  month: number; // 1-12
  year: number;
  // Dias do mês (1-31)
  day1?: ShiftType;
  day2?: ShiftType;
  day3?: ShiftType;
  day4?: ShiftType;
  day5?: ShiftType;
  day6?: ShiftType;
  day7?: ShiftType;
  day8?: ShiftType;
  day9?: ShiftType;
  day10?: ShiftType;
  day11?: ShiftType;
  day12?: ShiftType;
  day13?: ShiftType;
  day14?: ShiftType;
  day15?: ShiftType;
  day16?: ShiftType;
  day17?: ShiftType;
  day18?: ShiftType;
  day19?: ShiftType;
  day20?: ShiftType;
  day21?: ShiftType;
  day22?: ShiftType;
  day23?: ShiftType;
  day24?: ShiftType;
  day25?: ShiftType;
  day26?: ShiftType;
  day27?: ShiftType;
  day28?: ShiftType;
  day29?: ShiftType;
  day30?: ShiftType;
  day31?: ShiftType;
  createdAt: string;
  updatedAt: string;
}

export type ShiftType = 'SD' | 'DR' | '12' | '24' | '6h';

export interface ScheduleEmployee {
  id: string;
  name: string;
  position: string;
  cpf: string;
  professionalRegistry?: string;
  unit: string;
}

export interface SobreavisoEmployee {
  id: string;
  fullName: string;
  cpf: string;
  position: string;
  phone: string;
  pix?: string;
  unit: 'Botafogo' | 'Tijuca' | 'Ambas';
  status: 'Ativo' | 'Inativo';
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyScheduleReport {
  employeeId: string;
  employeeName: string;
  position: string;
  unit: string;
  totalShifts: number;
  shiftBreakdown: {
    SD: number;
    DR: number;
    '12': number;
    '24': number;
    '6h': number;
  };
  substitutions: number;
  actualDaysWorked: number;
}

export interface ScheduleSubstitution {
  id: string;
  employeeId: string;
  scheduleType: string;
  unit: string;
  month: number;
  year: number;
  day: number;
  substituteId?: string;
  substituteName: string;
  reason: string;
  createdAt: string;
}

// Cardápio Module Types
export interface WeeklyMenu {
  id: string;
  unit: 'Botafogo' | 'Tijuca';
  dietType: 'Dieta Branda' | 'Dieta Pastosa' | 'Dieta Branda para Diabéticos' | 'Dieta Branda para Hipertensos';
  weekStartDate: string; // Data de início da semana (Quarta-feira)
  weekEndDate: string; // Data de fim da semana (Terça-feira)
  weekNumber: number; // Semana do ano
  year: number;
  
  // Dias da semana (Quarta a Terça)
  wednesday: DailyMenu;
  thursday: DailyMenu;
  friday: DailyMenu;
  saturday: DailyMenu;
  sunday: DailyMenu;
  monday: DailyMenu;
  tuesday: DailyMenu;
  
  observations: string; // Observações específicas da semana
  dietNotes: string; // Notas fixas da dieta
  status: 'Rascunho' | 'Publicado' | 'Arquivado';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyMenu {
  breakfastCoffee: string; // Café da manhã
  morningSnack: string; // Colação
  lunch: string; // Almoço
  dailyJuice: string; // Suco do dia
  dessert: string; // Sobremesa
  afternoonSnack: string; // Lanche
  dinner: string; // Jantar
  eveningJuice: string; // Suco do jantar
  lateNightSnack: string; // Ceia
}

export interface FoodItem {
  id: string;
  name: string;
  category: 'Proteína' | 'Carboidrato' | 'Verdura' | 'Legume' | 'Fruta' | 'Bebida' | 'Sobremesa' | 'Tempero' | 'Outro';
  mealType: 'Café da manhã' | 'Colação' | 'Almoço' | 'Suco' | 'Sobremesa' | 'Lanche' | 'Jantar' | 'Ceia' | 'Qualquer';
  isPopular: boolean; // Para sugestões
  createdAt: string;
}

export interface EmployeeContextType {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  getEmployee: (id: string) => Employee | undefined;
  getExpiringItems: () => ExpiringItem[];
}

// Re-export agravos types
export * from './agravos';

// Re-export prontuario types
export * from './prontuario';

// Re-export CRM types
export * from './crm';