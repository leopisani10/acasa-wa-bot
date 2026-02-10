export interface GuestFinancialRecord {
  id: string;
  guestId: string;
  monthlyFee: number;
  monthlyDueDay: number;
  climatizationFee: number;
  climatizationDueDay: number;
  maintenanceFee: number;
  maintenanceDueDay: number;
  trousseauFee: number;
  trousseauDueDay: number;
  thirteenthSalaryFee: number;
  thirteenthSalaryDueDay: number;
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
