import { docClient, USERS_TABLE_NAME } from '../config/aws';
import {
  normalizeUserPayload,
  buildUserItem,
  UserItem,
  UserPayloadInput,
} from '../models/user.model';

export async function getUserById(
  userId: string,
): Promise<UserItem | null> {
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

export async function upsertUser(
  payload: UserPayloadInput,
): Promise<UserItem> {
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
