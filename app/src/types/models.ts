export interface SplitShare {
  participant: string;
  amount: number;
  settled?: boolean;
}

export interface SplitDetails {
  isSplit: boolean;
  splitMethod: 'equal';
  paidBy: string;
  participants: string[];
  shares: SplitShare[];
}

export interface ExpenseItem {
  id: string;
  userId?: string;
  title: string;
  merchant?: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  split?: SplitDetails;
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
