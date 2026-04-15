export interface UserPayloadInput {
  userId?: string;
  email?: string;
  name?: string;
  phone?: string;
  monthlyBudget?: number;
  savingsGoal?: number;
  setupCompleted?: boolean;
}

export interface UserItem {
  userId: string;
  email: string;
  name: string;
  phone: string;
  monthlyBudget: number;
  savingsGoal: number;
  setupCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export function normalizeUserPayload(payload: UserPayloadInput | undefined) {
  const source = payload || {};

  return {
    userId: String(source.userId || '').trim(),
    email: String(source.email || '')
      .trim()
      .toLowerCase(),
    name: String(source.name || '').trim(),
    phone: String(source.phone || '').trim(),
    monthlyBudget: Number(source.monthlyBudget || 0),
    savingsGoal: Number(source.savingsGoal || 0),
    setupCompleted:
      typeof source.setupCompleted === 'boolean'
        ? source.setupCompleted
        : undefined,
  };
}

//this is for build the user item
/**
 * @param {ReturnType<typeof normalizeUserPayload>} normalized - The normalized payload.
 * @param {UserItem | null | undefined} existing - The existing user item.
 * @returns {UserItem} The user item.
 */

export function buildUserItem(
  normalized: ReturnType<typeof normalizeUserPayload>,
  existing: UserItem | null | undefined,
): UserItem {
  const now = new Date().toISOString();

  return {
    userId: normalized.userId,
    email: normalized.email,
    name: normalized.name,
    phone: normalized.phone,
    monthlyBudget:
      Number.isFinite(normalized.monthlyBudget) && normalized.monthlyBudget > 0
        ? Number(Number(normalized.monthlyBudget).toFixed(2))
        : Number(existing?.monthlyBudget || 30000),
    savingsGoal:
      Number.isFinite(normalized.savingsGoal) && normalized.savingsGoal > 0
        ? Number(Number(normalized.savingsGoal).toFixed(2))
        : Number(existing?.savingsGoal || 5000),
    setupCompleted:
      typeof normalized.setupCompleted === 'boolean'
        ? normalized.setupCompleted
        : Boolean(existing?.setupCompleted),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}
