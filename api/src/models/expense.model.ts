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

export interface ExpensePayload {
  userId: string;
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  expenseDate?: string;
  notes?: string;
  split?: SplitDetails;
}

export interface ExpenseItem {
  userId: string;
  id: string;
  title: string;
  amount: number;
  category: string;
  expenseDate: string;
  date: string;
  notes: string;
  split?: SplitDetails;
  createdAt: string;
}

export function buildExpenseItem(payload: ExpensePayload): ExpenseItem {
  const normalizedDate = String(payload.date);
  const expenseDate = String(
    payload.expenseDate || `${normalizedDate}#${String(payload.id)}`,
  );

  const normalizeParticipant = (value: unknown) => String(value || '').trim();
  const uniqueParticipants = Array.from(
    new Set(
      (Array.isArray(payload.split?.participants)
        ? payload.split?.participants
        : []
      )
        .map(normalizeParticipant)
        .filter(Boolean),
    ),
  );
  const splitMethod =
    payload.split?.splitMethod === 'custom' ? 'custom' : 'equal';

  return {
    userId: String(payload.userId),
    id: String(payload.id),
    title: String(payload.title),
    amount: Number(Number(payload.amount).toFixed(2)),
    category: String(payload.category),
    expenseDate,
    date: normalizedDate,
    notes: String(payload.notes || ''),
    split:
      payload.split && payload.split.isSplit
        ? {
            isSplit: true,
            splitMethod,
            paidBy: String(payload.split.paidBy || 'You').trim(),
            participants: uniqueParticipants,
            shares: Array.isArray(payload.split.shares)
              ? payload.split.shares
                  .map(share => ({
                  participant: String(share?.participant || '').trim(),
                  amount: Number(Number(share?.amount || 0).toFixed(2)),
                  settled: Boolean(share?.settled),
                  }))
                  .filter(
                    share =>
                      share.participant &&
                      uniqueParticipants.includes(share.participant),
                  )
              : [],
          }
        : undefined,
    createdAt: new Date().toISOString(),
  };
}
