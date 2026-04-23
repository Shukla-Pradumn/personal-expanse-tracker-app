import AWS from 'aws-sdk';

const REGION = process.env.AWS_REGION || 'ap-south-1';
export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'expenses';
export const USERS_TABLE_NAME = process.env.DYNAMODB_USERS_TABLE_NAME || 'users';
export const GROUPS_TABLE_NAME =
  process.env.DYNAMODB_GROUPS_TABLE_NAME || 'groups';
export const GROUP_MEMBERS_TABLE_NAME =
  process.env.DYNAMODB_GROUP_MEMBERS_TABLE_NAME || 'group_members';
export const GROUP_EXPENSES_TABLE_NAME =
  process.env.DYNAMODB_GROUP_EXPENSES_TABLE_NAME || 'group_expenses';

AWS.config.update({
  region: REGION,
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : {}),
});

export const docClient = new AWS.DynamoDB.DocumentClient();
