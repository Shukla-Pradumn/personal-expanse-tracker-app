export interface ExpenseItem {
  id: string;
  userId?: string;
  title: string;
  merchant?: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
}

export interface FooterLink {
  label: string;
  route: string;
  icon: string;
}

export interface UserProfileItem {
  userId: string;
  email: string;
  name: string;
  phone: string;
  monthlyBudget?: number;
  savingsGoal?: number;
  setupCompleted?: boolean;
}
