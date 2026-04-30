import { docClient, USERS_TABLE_NAME } from '../config/aws';
import {
  normalizeUserPayload,
  buildUserItem,
  UserItem,
  UserPayloadInput,
} from '../models/user.model';

//this is for get the user by id
export async function getUserById(userId: string): Promise<UserItem | null> {
  const response = await docClient
    .get({
      TableName: USERS_TABLE_NAME,
      Key: {
        userId: String(userId),
      },
    })
    .promise();

  return (response.Item as UserItem) || null;
}

export async function getUserByEmail(email: string): Promise<UserItem | null> {
  const normalizedEmail = String(email || '')
    .trim()
    .toLowerCase();
  if (!normalizedEmail) return null;
  const response = await docClient
    .scan({
      TableName: USERS_TABLE_NAME,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': normalizedEmail },
      Limit: 1,
    })
    .promise();
  return ((response.Items || [])[0] as UserItem) || null;
}

//this is for update/create the user
export async function upsertUser(payload: UserPayloadInput): Promise<UserItem> {
  const normalizedPayload = normalizeUserPayload(payload);
  const existing = await getUserById(normalizedPayload.userId);

  const item = buildUserItem(normalizedPayload, existing);

  await docClient
    .put({
      TableName: USERS_TABLE_NAME,
      Item: item,
    })
    .promise();

  return item;
}

export async function updateUserLoanTrackByEmail(
  email: string,
  loanTrackId: string,
  isVerified: boolean,
): Promise<UserItem | null> {
  const existing = await getUserByEmail(email);
  if (!existing) return null;

  const item: UserItem = {
    ...existing,
    loanTrackId: String(loanTrackId || '').trim(),
    isVerified: Boolean(isVerified),
    updatedAt: new Date().toISOString(),
  };

  await docClient
    .put({
      TableName: USERS_TABLE_NAME,
      Item: item,
    })
    .promise();

  return item;
}

export async function getUsersByLoanTrackIds(loanTrackIds: string[]) {
  const ids = Array.from(
    new Set(
      loanTrackIds
        .map((value) => String(value || '').trim())
        .filter(Boolean),
    ),
  );
  if (!ids.length) return [] as UserItem[];

  const placeholders: Record<string, string> = {};
  const values: Record<string, string> = {};
  ids.forEach((id, index) => {
    const key = `:id${index}`;
    placeholders[key] = key;
    values[key] = id;
  });
  const inList = Object.values(placeholders).join(', ');

  const response = await docClient
    .scan({
      TableName: USERS_TABLE_NAME,
      FilterExpression: `loanTrackId IN (${inList})`,
      ExpressionAttributeValues: values,
    })
    .promise();

  return (response.Items || []) as UserItem[];
}

export async function getUsersByTransactionId(transactionId: string) {
  const normalized = String(transactionId || '').trim();
  if (!normalized) return [] as UserItem[];

  const response = await docClient
    .scan({
      TableName: USERS_TABLE_NAME,
      FilterExpression: 'lastPaymentTransactionId = :transactionId',
      ExpressionAttributeValues: { ':transactionId': normalized },
    })
    .promise();

  return (response.Items || []) as UserItem[];
}

export async function updateUsersPaymentStateByLoanTrackIds(
  loanTrackIds: string[],
  transactionId: string,
  status: string,
) {
  const users = await getUsersByLoanTrackIds(loanTrackIds);
  const normalizedTransactionId = String(transactionId || '').trim();
  const normalizedStatus = String(status || '').trim();
  const now = new Date().toISOString();

  await Promise.all(
    users.map((user) =>
      docClient
        .put({
          TableName: USERS_TABLE_NAME,
          Item: {
            ...user,
            lastPaymentTransactionId: normalizedTransactionId,
            lastPaymentStatus: normalizedStatus,
            updatedAt: now,
          },
        })
        .promise(),
    ),
  );

  return users.map((user) => ({
    ...user,
    lastPaymentTransactionId: normalizedTransactionId,
    lastPaymentStatus: normalizedStatus,
    updatedAt: now,
  }));
}

export async function updateUsersPaymentStateByTransactionId(
  transactionId: string,
  status: string,
) {
  const users = await getUsersByTransactionId(transactionId);
  const normalizedTransactionId = String(transactionId || '').trim();
  const normalizedStatus = String(status || '').trim();
  const now = new Date().toISOString();

  await Promise.all(
    users.map((user) =>
      docClient
        .put({
          TableName: USERS_TABLE_NAME,
          Item: {
            ...user,
            lastPaymentTransactionId: normalizedTransactionId,
            lastPaymentStatus: normalizedStatus,
            updatedAt: now,
          },
        })
        .promise(),
    ),
  );

  return users.map((user) => ({
    ...user,
    lastPaymentTransactionId: normalizedTransactionId,
    lastPaymentStatus: normalizedStatus,
    updatedAt: now,
  }));
}
