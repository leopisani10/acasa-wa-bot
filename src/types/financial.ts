export interface GuestFinancialRecord {
  id: string;
  guestId: string;
  monthlyFee: number;
  monthlyDueDay: number;
  climatizationFee: number;
  climatizationDueDay: number;
  climatizationInstallments: number;
  maintenanceFee: number;
  maintenanceDueDay: number;
  maintenanceInstallments: number;
  trousseauFee: number;
  trousseauDueDay: number;
  trousseauInstallments: number;
  thirteenthSalaryFee: number;
  thirteenthSalaryDueDay: number;
  thirteenthSalaryInstallments: number;
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
  monthlyFeePaid: boolean;
  paymentDate?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
