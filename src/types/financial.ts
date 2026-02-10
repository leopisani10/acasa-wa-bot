export interface GuestFinancialRecord {
  id: string;
  guestId: string;
  monthlyFee: number;
  monthlyDueDay: number;
  climatizationFee: number;
  climatizationDueDay: number;
  climatizationInstallments: number;
  climatizationStartMonth?: string;
  climatizationSelectedMonths: string[];
  maintenanceFee: number;
  maintenanceDueDay: number;
  maintenanceInstallments: number;
  maintenanceStartMonth?: string;
  maintenanceSelectedMonths: string[];
  trousseauFee: number;
  trousseauDueDay: number;
  trousseauInstallments: number;
  trousseauStartMonth?: string;
  trousseauSelectedMonths: string[];
  thirteenthSalaryFee: number;
  thirteenthSalaryDueDay: number;
  thirteenthSalaryInstallments: number;
  thirteenthSalaryStartMonth?: string;
  thirteenthSalarySelectedMonths: string[];
  adjustedCurrentYear: boolean;
  retroactiveAmount: number;
  adjustmentYear?: number;
  outstandingBalance: number;
  isActive: boolean;
  inactivationDate?: string;
  revenueLoss: number;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialAdjustment {
  id: string;
  guestId: string;
  adjustmentDate: string;
  previousMonthlyFee: number;
  newMonthlyFee: number;
  adjustmentPercentage: number;
  notes: string;
  createdAt: string;
  createdBy: string;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  activeGuests: number;
  inactiveGuests: number;
  revenueLoss: number;
  netRevenue: number;
}

export interface RevenueComparison {
  currentMonth: string;
  previousMonth: string;
  difference: number;
  percentageChange: number;
  newGuests: number;
  lostGuests: number;
}

export interface MonthlyPayment {
  id: string;
  guestId: string;
  paymentMonth: string;
  expectedAmount: number;
  amountPaid?: number;
  amountDifference: number;
  hasDifference: boolean;
  monthlyFeePaid: boolean;
  paymentDate?: string;
  paymentNotes?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
