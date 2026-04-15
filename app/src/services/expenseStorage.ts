import {
  getCurrentUserId,
  getUserProfile,
  updateMonthlyBudget,
} from './userProfile';
import { getAuthHeaders } from './authSession';
import type { ExpenseItem } from '../types/models';

const DEFAULT_MONTHLY_BUDGET = 30000;

let memoryExpenses: ExpenseItem[] = [];
let memoryBudget = DEFAULT_MONTHLY_BUDGET;

const canUseApi = () => process.env.EXPO_PUBLIC_API_BASE_URL?.length > 0;

const getApiExpensesUrl = (userId: string) =>
  `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/expenses?userId=${encodeURIComponent(userId)}`;

export async function getExpenses() {
  const userId = await getCurrentUserId();
  if (canUseApi()) {
    try {
      const url = getApiExpensesUrl(userId);
      console.log('GET expenses =>', url);
      const authHeaders = await getAuthHeaders();
      const response = await fetch(url, { headers: authHeaders });
      if (response.ok) {
        const data = await response.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        memoryExpenses = items;
        return items;
      }
      console.warn('GET expenses failed =>', response.status);
    } catch (error: any) {
      console.warn('GET expenses error =>', error?.message || 'Unknown error');
    }
  } else {
    console.warn('GET expenses skipped: EXPO_PUBLIC_API_BASE_URL is missing.');
  }

  try {
    return memoryExpenses;
  } catch {
    return [];
  }
}

export async function saveExpense(expense: ExpenseItem) {
  const userId = await getCurrentUserId();
  if (canUseApi()) {
    try {
      const url = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/expenses`;
      console.log('POST expense =>', url, { ...expense, userId });
      const authHeaders = await getAuthHeaders();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          ...expense,
          userId,
        }),
      });
      console.log('POST expense status =>', response);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message || 'Failed to save expense via API');
      }

      const saved = await response.json();
      const savedItem = saved?.item ?? expense;
      const updatedFromApi = [savedItem, ...memoryExpenses];
      memoryExpenses = updatedFromApi;
      return updatedFromApi;
    } catch (error: any) {
      console.warn('POST expense error =>', error?.message || 'Unknown error');
    }
  } else {
    console.warn('POST expense skipped: EXPO_PUBLIC_API_BASE_URL is missing.');
  }

  const existing = await getExpenses();
  const updated = [expense, ...existing];
  memoryExpenses = updated;
  try {
  } catch {
    // Keep in-memory fallback if native storage is unavailable.
  }
  return updated;
}

export async function getMonthlyBudget() {
  try {
    const profile = await getUserProfile();
    const profileBudget = Number(profile?.monthlyBudget);
    if (Number.isFinite(profileBudget) && profileBudget > 0) {
      memoryBudget = profileBudget;
      return profileBudget;
    }
  } catch {
    // Fall through to local cache/fallback.
  }

  try {
    return memoryBudget;
  } catch {
    return DEFAULT_MONTHLY_BUDGET;
  }
}
export async function setMonthlyBudget(budget: number) {
  const sanitized = Number(Number(budget).toFixed(2));
  if (!Number.isFinite(sanitized) || sanitized <= 0) {
    throw new Error('Please enter a valid monthly budget.');
  }

  memoryBudget = sanitized;
  await updateMonthlyBudget(sanitized);
  return sanitized;
}
