import { getAuthHeaders } from './authSession';
import type {
  ExpenseItem,
  GroupBalanceResponse,
  GroupItem,
  GroupMemberItem,
} from '../types/models';

const canUseApi = () => process.env.EXPO_PUBLIC_API_BASE_URL?.length > 0;
const getBaseUrl = () => `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/groups`;

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!canUseApi()) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is missing.');
  }
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(init?.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message || body?.error || 'Request failed');
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  if (!text.trim()) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export async function getGroups() {
  const data = await api<{ items: GroupItem[] }>('/');
  return Array.isArray(data?.items) ? data.items : [];
}

export async function createGroup(name: string) {
  const data = await api<{ group: GroupItem }>('/', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return data?.group;
}

export async function inviteGroupMember(
  groupId: string,
  email: string,
  name?: string,
) {
  const data = await api<{ item: GroupMemberItem }>(
    `/${encodeURIComponent(groupId)}/invite`,
    {
      method: 'POST',
      body: JSON.stringify({ email, name: name || '' }),
    },
  );
  return data?.item;
}

export async function joinGroup(groupId: string) {
  const data = await api<{ item: GroupMemberItem }>(
    `/${encodeURIComponent(groupId)}/join`,
    {
      method: 'POST',
    },
  );
  return data?.item;
}

export async function getGroupMembers(groupId: string) {
  const data = await api<{ items: GroupMemberItem[] }>(
    `/${encodeURIComponent(groupId)}/members`,
  );
  return Array.isArray(data?.items) ? data.items : [];
}

export async function getGroupExpenses(groupId: string) {
  const data = await api<{ items: ExpenseItem[] }>(
    `/${encodeURIComponent(groupId)}/expenses`,
  );
  return Array.isArray(data?.items) ? data.items : [];
}

export async function createGroupExpense(
  groupId: string,
  payload: ExpenseItem,
) {
  const data = await api<{ item: ExpenseItem }>(
    `/${encodeURIComponent(groupId)}/expenses`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return data?.item;
}

export async function updateGroupExpense(
  groupId: string,
  expenseId: string,
  payload: ExpenseItem,
) {
  const data = await api<{ item: ExpenseItem }>(
    `/${encodeURIComponent(groupId)}/expenses/${encodeURIComponent(expenseId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  );
  return data?.item;
}

export async function deleteGroupExpense(groupId: string, expenseId: string) {
  await api<unknown>(
    `/${encodeURIComponent(groupId)}/expenses/${encodeURIComponent(expenseId)}`,
    {
      method: 'DELETE',
    },
  );
}

export async function getGroupBalances(groupId: string) {
  return api<GroupBalanceResponse>(`/${encodeURIComponent(groupId)}/balances`);
}
