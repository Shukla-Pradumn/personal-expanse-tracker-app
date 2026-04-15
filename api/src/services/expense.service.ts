import { docClient, TABLE_NAME } from '../config/aws';
import {
  buildExpenseItem,
  ExpenseItem,
  ExpensePayload,
} from '../models/expense.model';

//this is for get the expenses by user id
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
    (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
  );
}

//this is for create the expense
export async function createExpense(
  payload: ExpensePayload,
): Promise<ExpenseItem> {
  const item = buildExpenseItem(payload);

  await docClient
    .put({
      TableName: TABLE_NAME,
      Item: item,
    })
    .promise();

  return item;
}
