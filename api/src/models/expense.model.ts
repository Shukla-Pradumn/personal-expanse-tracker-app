export interface ExpensePayload {
  userId: string;
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  expenseDate?: string;
  notes?: string;
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
  createdAt: string;
}

export function buildExpenseItem(payload: ExpensePayload): ExpenseItem {
  const normalizedDate = String(payload.date);
  const expenseDate = String(
    payload.expenseDate || `${normalizedDate}#${String(payload.id)}`,
  );

  return {
    userId: String(payload.userId),
    id: String(payload.id),
    title: String(payload.title),
    amount: Number(Number(payload.amount).toFixed(2)),
    category: String(payload.category),
    expenseDate,
    date: normalizedDate,
    notes: String(payload.notes || ''),
    createdAt: new Date().toISOString(),
  };
}
