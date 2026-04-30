export interface SplitShare {
  participant: string;
  amount: number;
  settled?: boolean;
}

export interface SplitDetails {
  isSplit: boolean;
  splitMethod: 'equal' | 'custom';
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

export interface GroupItem {
  groupId: string;
  name: string;
  createdBy: string;
  createdAt: string;
  membership?: {
    role: 'owner' | 'member';
    status: 'invited' | 'active';
  };
}

export interface GroupMemberItem {
  membershipId: string;
  groupId: string;
  userId: string;
  email: string;
  name: string;
  role: 'owner' | 'member';
  status: 'invited' | 'active';
  invitedBy: string;
  createdAt: string;
}

export interface GroupBalanceItem {
  member: string;
  amount: number;
}

export interface GroupBalanceResponse {
  currentMemberKey?: string;
  summary: {
    totalExpenses: number;
    youOwe: number;
    youAreOwed: number;
    net: number;
  };
  net: GroupBalanceItem[];
}

export interface PaymentVerificationData {
  toUserId: string;
  fromUserId: string;
  toEmail: string;
  fromEmail: string;
  isVerified: boolean;
}

export interface PaymentStatusData {
  status: string;
  updatedAt: string;
  message?: string;
  transactionId?: string;
}
