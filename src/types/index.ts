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
  stayType: 'Longa Permanência' | 'Centro Dia';
  admissionDate: string;
  exitDate?: string;
  exitReason?: 'Óbito' | 'Outro';
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
  unit: 'Botafogo';

  // Taxas
  climatizationFee: boolean; // Janeiro, Fevereiro e Março
  maintenanceFee: boolean; // Agosto
  trousseauFee: boolean; // Julho e Setembro
  administrativeFee: boolean; // Agosto e Novembro

  // Acomodação e Cuidados
  roomNumber: string;

  // Plano de Saúde e Serviços de Saúde
  healthPlan?: string;
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
  unit: 'Botafogo';
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
  unit: 'Botafogo';
  status: 'Ativo' | 'Inativo' | 'Afastado' | 'Férias';
  photo?: string;
  covidVaccines: CovidVaccine[];
  observations?: string;
  professionalLicense?: ProfessionalLicense;
  receivesTransportation: boolean;

  // Tipo de vínculo (condiciona outros campos)
  employmentType: 'CLT' | 'Contrato' | 'Terceirizado' | 'Estágio' | 'Sobreaviso' | 'Outro';
  
  // Campos específicos por tipo de vínculo
  cltData?: CLTData;
  contractData?: ContractData;
  outsourcedData?: OutsourcedData;
  
  // Campos de saída (quando status = Inativo)
  exitDate?: string;
  exitReason?: 'Rescisão' | 'Demissão' | 'Pedido de Demissão';
  
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
  unit: 'Botafogo';
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
  unit: 'Botafogo';
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
  unit: 'Botafogo' | 'Ambas';
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
  unit: 'Botafogo';
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

// Transportation Voucher
export interface TransportationVoucher {
  id: string;
  employeeId: string;
  employeeName?: string;
  referenceMonth: string;
  dailyValue: number;
  workingDays: number;
  totalValue: number;
  paymentDate?: string;
  paid: boolean;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransportationVoucherContextType {
  vouchers: TransportationVoucher[];
  loading: boolean;
  error: string | null;
  addVoucher: (voucher: Omit<TransportationVoucher, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateVoucher: (id: string, voucher: Partial<TransportationVoucher>) => Promise<void>;
  deleteVoucher: (id: string) => Promise<void>;
  getVouchersByEmployee: (employeeId: string) => TransportationVoucher[];
  getVouchersByMonth: (month: string) => TransportationVoucher[];
}

// Re-export agravos types
export * from './agravos';

// Re-export prontuario types
export * from './prontuario';

// Re-export CRM types
export * from './crm';

// Labor Agreement Types
export type PaymentStatus = 'pending' | 'paid' | 'overdue';

export interface LaborAgreement {
  id: string;
  claimantName: string;
  companyName: string;
  lawyerFullName: string;
  pixKey: string;
  processNumber?: string;
  laborCourt?: string;
  jurisdiction?: string;
  totalAmount: number;
  installmentCount: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LaborAgreementInstallment {
  id: string;
  agreementId: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paymentStatus: PaymentStatus;
  paymentDate?: string;
  paymentProof?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LaborAgreementWithInstallments extends LaborAgreement {
  installments: LaborAgreementInstallment[];
}

export interface LaborAgreementStatistics {
  totalAgreements: number;
  totalPendingAmount: number;
  totalPaidAmount: number;
  overdueInstallments: number;
  upcomingInstallments: number;
}

export interface LaborAgreementContextType {
  agreements: LaborAgreementWithInstallments[];
  loading: boolean;
  error: string | null;
  fetchAgreements: () => Promise<void>;
  fetchAgreementById: (id: string) => Promise<LaborAgreementWithInstallments | null>;
  addAgreement: (agreement: Omit<LaborAgreement, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, installments: Omit<LaborAgreementInstallment, 'id' | 'agreementId' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  updateAgreement: (id: string, agreement: Partial<LaborAgreement>) => Promise<void>;
  deleteAgreement: (id: string) => Promise<void>;
  updateInstallment: (id: string, installment: Partial<LaborAgreementInstallment>) => Promise<void>;
  markInstallmentAsPaid: (id: string, paymentDate: string, paymentProof?: string) => Promise<void>;
  getUpcomingInstallments: (days: number) => LaborAgreementInstallment[];
  getOverdueInstallments: () => LaborAgreementInstallment[];
  getStatistics: () => LaborAgreementStatistics;
}

// Payroll Types
export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  employmentType?: 'CLT' | 'Contrato' | 'Terceirizado' | 'Estágio' | 'Sobreaviso' | 'Outro';
  referenceMonth: string;
  referenceYear: number;
  baseSalary: number;
  overtimeHours: number;
  overtimeAmount: number;
  nightShiftHours: number;
  nightShiftAmount: number;
  hazardPay: number;
  foodAllowance: number;
  transportationAllowance: number;
  healthInsurance: number;
  otherBenefits: number;
  inssDeduction: number;
  irrfDeduction: number;
  otherDeductions: number;
  grossSalary: number;
  netSalary: number;
  paymentDate?: string;
  paymentStatus: 'pending' | 'processing' | 'paid' | 'cancelled';
  paymentMethod?: 'bank_transfer' | 'check' | 'cash';
  notes?: string;
  workDates?: string[];
  simplifiedPayment?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollAdjustment {
  id: string;
  payrollId: string;
  adjustmentType: 'addition' | 'deduction' | 'correction';
  amount: number;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface ShiftPayment {
  id: string;
  sobreaviso_employee_id: string;
  shift_date: string;
  shift_type: string;
  hours_worked: number;
  hourly_rate: number;
  total_amount: number;
  notes?: string;
  payroll_entry_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollContextType {
  payrolls: PayrollRecord[];
  adjustments: PayrollAdjustment[];
  loading: boolean;
  error: string | null;
  addPayroll: (payroll: Omit<PayrollRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePayroll: (id: string, payroll: Partial<PayrollRecord>) => Promise<void>;
  deletePayroll: (id: string) => Promise<void>;
  getPayrollsByEmployee: (employeeId: string) => PayrollRecord[];
  getPayrollsByMonth: (month: string, year: number) => PayrollRecord[];
  addAdjustment: (adjustment: Omit<PayrollAdjustment, 'id' | 'createdAt'>) => Promise<void>;
  getAdjustmentsByPayroll: (payrollId: string) => PayrollAdjustment[];
  getShiftPaymentsByEmployeeAndMonth: (employeeId: string, month: string, year: number) => Promise<ShiftPayment[]>;
}

// Room Management Types
export interface Room {
  id: string;
  roomNumber: string;
  floor: 1 | 2 | 3;
  bedCount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bed {
  id: string;
  roomId: string;
  bedNumber: number;
  guestId?: string | null;
  status: 'Ativa' | 'Inativa';
  inactiveReason?: string;
  deactivatedAt?: string;
  deactivatedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomWithBeds extends Room {
  beds: BedWithGuest[];
}

export interface BedWithGuest extends Bed {
  guest?: Guest | null;
}

export interface RoomContextType {
  rooms: RoomWithBeds[];
  loading: boolean;
  error: string | null;
  addRoom: (room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRoom: (id: string, room: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  allocateGuestToBed: (bedId: string, guestId: string | null) => Promise<void>;
  updateBed: (bedId: string, updates: Partial<Bed>) => Promise<void>;
  getRoomsByFloor: (floor: number) => RoomWithBeds[];
  getAvailableBeds: () => BedWithGuest[];
  fetchRooms: () => Promise<void>;
}