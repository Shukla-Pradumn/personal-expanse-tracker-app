import { Auth } from 'aws-amplify';
import { clearAuthSession, getAuthHeaders } from './authSession';
import { getApiBaseUrl } from '../config/env';

const FALLBACK_USER_ID = 'demo-user';

const canUseApi = () => getApiBaseUrl().length > 0;

const getUserUrl = (userId: string) =>
  `${getApiBaseUrl()}/api/users/${encodeURIComponent(userId)}`;

export async function getCurrentUserId() {
  try {
    const user = await Auth.currentAuthenticatedUser();
    const userId =
      user?.attributes?.sub || user?.username || user?.attributes?.email;
    if (userId) {
      const normalized = String(userId);
      return normalized;
    }
  } catch {
    // Ignore and use fallback value.
  }

  return FALLBACK_USER_ID;
}

export async function createOrUpdateUserProfile(payload: {
  userId: string;
  email: string;
  name: string;
  phone?: string;
  monthlyBudget?: number;
  savingsGoal?: number;
  setupCompleted?: boolean;
}) {
  const item = {
    userId: String(payload.userId),
    email: String(payload.email),
    name: String(payload.name),
    phone: String(payload.phone || ''),
    ...(Number.isFinite(Number(payload.monthlyBudget)) &&
    Number(payload.monthlyBudget) > 0
      ? { monthlyBudget: Number(payload.monthlyBudget) }
      : {}),
    ...(Number.isFinite(Number(payload.savingsGoal)) &&
    Number(payload.savingsGoal) > 0
      ? { savingsGoal: Number(payload.savingsGoal) }
      : {}),
    ...(typeof payload.setupCompleted === 'boolean'
      ? { setupCompleted: payload.setupCompleted }
      : {}),
  };

  if (!canUseApi()) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is missing.');
  }

  const userApiUrl = `${getApiBaseUrl()}/api/users`;
  console.log('POST user profile =>', userApiUrl, item);
  const authHeaders = await getAuthHeaders();
  const response = await fetch(userApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(item),
  });
  console.log('POST user profile status =>', response.status);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message || 'Failed to save user profile');
  }

  const data = await response.json();
  const saved = data?.item || item;
  return saved;
}

export async function updateMonthlyBudget(monthlyBudget: number) {
  const userId = await getCurrentUserId();
  const existing = await getUserProfile();
  const fallbackEmail = `${userId}@budget.local`;

  return createOrUpdateUserProfile({
    userId,
    email: existing?.email || fallbackEmail,
    name: existing?.name || 'User',
    phone: existing?.phone || '',
    monthlyBudget: Number(monthlyBudget),
    savingsGoal: Number(existing?.savingsGoal || 5000),
    setupCompleted: Boolean(existing?.setupCompleted),
  });
}

export async function updateUserName(name: string) {
  const trimmedName = String(name || '').trim();
  if (!trimmedName) {
    throw new Error('Please enter a valid name.');
  }

  const userId = await getCurrentUserId();
  const existing = await getUserProfile().catch(() => null);
  const fallbackEmail = `${userId}@budget.local`;

  return createOrUpdateUserProfile({
    userId,
    email: existing?.email || fallbackEmail,
    name: trimmedName,
    phone: existing?.phone || '',
    monthlyBudget: Number(existing?.monthlyBudget || 30000),
    savingsGoal: Number(existing?.savingsGoal || 5000),
    setupCompleted: Boolean(existing?.setupCompleted),
  });
}

export async function updateSavingsGoal(savingsGoal: number) {
  const sanitized = Number(Number(savingsGoal).toFixed(2));
  if (!Number.isFinite(sanitized) || sanitized <= 0) {
    throw new Error('Please enter a valid savings goal.');
  }

  const userId = await getCurrentUserId();
  const existing = await getUserProfile();
  const fallbackEmail = `${userId}@budget.local`;

  return createOrUpdateUserProfile({
    userId,
    email: existing?.email || fallbackEmail,
    name: existing?.name || 'User',
    phone: existing?.phone || '',
    monthlyBudget: Number(existing?.monthlyBudget || 30000),
    savingsGoal: sanitized,
    setupCompleted: Boolean(existing?.setupCompleted),
  });
}

export async function isFinancialSetupComplete() {
  const profile = await getUserProfile().catch(() => null);
  return Boolean(profile?.setupCompleted);
}

export async function getUserProfile() {
  const userId = await getCurrentUserId();

  if (canUseApi()) {
    try {
      const url = getUserUrl(userId);
      console.log('GET user profile =>', url);
      const authHeaders = await getAuthHeaders();
      console.log('GET user profile authHeaders =>', authHeaders);
      const response = await fetch(url, { headers: authHeaders });
      if (response.ok) {
        const data = await response.json();
        const item = data?.item || null;
        if (item) {
          return item;
        }
      }
      console.warn('GET user profile failed =>', response.status);
    } catch (error: any) {
      console.warn(
        'GET user profile error =>',
        error?.message || 'Unknown error',
      );
    }
  }

  throw new Error('EXPO_PUBLIC_API_BASE_URL is missing.');
}

export async function clearUserSession() {
  await clearAuthSession();
}
