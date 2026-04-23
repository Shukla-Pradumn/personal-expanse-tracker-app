import type { SplitDetails } from './expense.model';

export interface GroupItem {
  groupId: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export type GroupMemberRole = 'owner' | 'member';
export type GroupMemberStatus = 'invited' | 'active';

export interface GroupMemberItem {
  membershipId: string;
  groupId: string;
  userId: string;
  email: string;
  name: string;
  role: GroupMemberRole;
  status: GroupMemberStatus;
  invitedBy: string;
  createdAt: string;
}

export interface GroupExpenseItem {
  groupId: string;
  expenseId: string;
  createdBy: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes: string;
  split: SplitDetails;
  createdAt: string;
}

export interface CreateGroupInput {
  name: string;
}

export interface InviteMemberInput {
  email: string;
  name?: string;
}

export interface CreateGroupExpenseInput {
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  split: SplitDetails;
}
