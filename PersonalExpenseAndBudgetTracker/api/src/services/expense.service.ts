import { docClient, TABLE_NAME } from '../config/aws';

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

export async function getExpensesByUserId(
  userId: string | undefined,
): Promise<ExpenseItem[]> {
  const response = await docClient
    .query({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    })
    .promise();

  const items = (response.Items || []) as ExpenseItem[];
  return items.sort(
    (a, b) =>
      new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
  );
}

export async function createExpense(
  payload: ExpensePayload,
): Promise<ExpenseItem> {
  const normalizedDate = String(payload.date);
  const expenseDate = String(
    payload.expenseDate || `${normalizedDate}#${String(payload.id)}`,
  );
  const item: ExpenseItem = {
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

  await docClient
    .put({
      TableName: TABLE_NAME,
      Item: item,
    })
    .promise();

  return item;
}
