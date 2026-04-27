import { docClient } from '../config/aws';
import {
  GROUPS_TABLE_NAME,
  GROUP_MEMBERS_TABLE_NAME,
  GROUP_EXPENSES_TABLE_NAME,
} from '../config/aws';
import type {
  CreateGroupExpenseInput,
  GroupExpenseItem,
  GroupItem,
  GroupMemberItem,
  InviteMemberInput,
} from '../models/group.model';

const nowIso = () => new Date().toISOString();
const normalize = (value: unknown) => String(value || '').trim();

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

async function ensureActiveMembership(groupId: string, userId: string) {
  const response = await docClient
    .scan({
      TableName: GROUP_MEMBERS_TABLE_NAME,
      FilterExpression:
        'groupId = :groupId AND userId = :userId AND #s = :active',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':groupId': groupId,
        ':userId': userId,
        ':active': 'active',
      },
    })
    .promise();
  const membership = (response.Items || [])[0] as GroupMemberItem | undefined;
  if (!membership) {
    throw new Error('Forbidden: you are not an active member of this group.');
  }
  return membership;
}

export async function createGroup(
  name: string,
  ownerUserId: string,
  ownerEmail: string,
  ownerName = 'Owner',
) {
  const groupId = createId('grp');
  const group: GroupItem = {
    groupId,
    name: normalize(name),
    createdBy: ownerUserId,
    createdAt: nowIso(),
  };
  const ownerMember: GroupMemberItem = {
    membershipId: createId('mbr'),
    groupId,
    userId: ownerUserId,
    email: normalize(ownerEmail).toLowerCase(),
    name: normalize(ownerName) || 'Owner',
    role: 'owner',
    status: 'active',
    invitedBy: ownerUserId,
    createdAt: nowIso(),
  };

  await Promise.all([
    docClient.put({ TableName: GROUPS_TABLE_NAME, Item: group }).promise(),
    docClient
      .put({ TableName: GROUP_MEMBERS_TABLE_NAME, Item: ownerMember })
      .promise(),
  ]);

  return { group, ownerMember };
}

export async function listGroupsForUser(userId: string) {
  const memberResponse = await docClient
    .scan({
      TableName: GROUP_MEMBERS_TABLE_NAME,
      FilterExpression: 'userId = :userId AND #s = :active',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':userId': userId, ':active': 'active' },
    })
    .promise();
  const memberships = (memberResponse.Items || []) as GroupMemberItem[];
  if (!memberships.length) return [];

  const groupResponse = await docClient
    .scan({ TableName: GROUPS_TABLE_NAME })
    .promise();
  const groups = (groupResponse.Items || []) as GroupItem[];
  const map = new Map(groups.map((group) => [group.groupId, group]));
  return memberships
    .map((membership) => {
      const group = map.get(membership.groupId);
      if (!group) return null;
      return {
        ...group,
        membership: {
          role: membership.role,
          status: membership.status,
        },
      };
    })
    .filter(Boolean);
}

export async function inviteMemberToGroup(
  groupId: string,
  invitedByUserId: string,
  input: InviteMemberInput,
) {
  await ensureActiveMembership(groupId, invitedByUserId);
  const email = normalize(input.email).toLowerCase();
  const existing = await docClient
    .scan({
      TableName: GROUP_MEMBERS_TABLE_NAME,
      FilterExpression: 'groupId = :groupId AND email = :email',
      ExpressionAttributeValues: { ':groupId': groupId, ':email': email },
    })
    .promise();
  const found = (existing.Items || [])[0] as GroupMemberItem | undefined;
  if (found) return found;

  const invitedMember: GroupMemberItem = {
    membershipId: createId('mbr'),
    groupId,
    userId: '',
    email,
    name: normalize(input.name) || email.split('@')[0] || 'Member',
    role: 'member',
    status: 'invited',
    invitedBy: invitedByUserId,
    createdAt: nowIso(),
  };
  await docClient
    .put({ TableName: GROUP_MEMBERS_TABLE_NAME, Item: invitedMember })
    .promise();
  return invitedMember;
}

export async function joinGroup(
  groupId: string,
  userId: string,
  email: string,
  name = '',
) {
  const normalizedEmail = normalize(email).toLowerCase();
  const memberResponse = await docClient
    .scan({
      TableName: GROUP_MEMBERS_TABLE_NAME,
      FilterExpression: 'groupId = :groupId AND email = :email',
      ExpressionAttributeValues: {
        ':groupId': groupId,
        ':email': normalizedEmail,
      },
    })
    .promise();
  const existing = (memberResponse.Items || [])[0] as
    | GroupMemberItem
    | undefined;
  if (existing) {
    const updated: GroupMemberItem = {
      ...existing,
      userId,
      name: normalize(name) || existing.name,
      status: 'active',
    };
    await docClient
      .put({ TableName: GROUP_MEMBERS_TABLE_NAME, Item: updated })
      .promise();
    return updated;
  }

  const member: GroupMemberItem = {
    membershipId: createId('mbr'),
    groupId,
    userId,
    email: normalizedEmail,
    name: normalize(name) || normalizedEmail.split('@')[0] || 'Member',
    role: 'member',
    status: 'active',
    invitedBy: userId,
    createdAt: nowIso(),
  };
  await docClient
    .put({ TableName: GROUP_MEMBERS_TABLE_NAME, Item: member })
    .promise();
  return member;
}

export async function getGroupMembers(groupId: string, userId: string) {
  await ensureActiveMembership(groupId, userId);
  const response = await docClient
    .scan({
      TableName: GROUP_MEMBERS_TABLE_NAME,
      FilterExpression: 'groupId = :groupId',
      ExpressionAttributeValues: { ':groupId': groupId },
    })
    .promise();
  return (response.Items || []) as GroupMemberItem[];
}

export async function createGroupExpense(
  groupId: string,
  createdBy: string,
  payload: CreateGroupExpenseInput,
) {
  await ensureActiveMembership(groupId, createdBy);
  const item: GroupExpenseItem = {
    groupId,
    expenseId: createId('gexp'),
    createdBy,
    title: normalize(payload.title),
    amount: Number(Number(payload.amount || 0).toFixed(2)),
    category: normalize(payload.category),
    date: String(payload.date),
    notes: normalize(payload.notes),
    split: payload.split,
    createdAt: nowIso(),
  };
  await docClient
    .put({ TableName: GROUP_EXPENSES_TABLE_NAME, Item: item })
    .promise();
  return item;
}

export async function updateGroupExpense(
  groupId: string,
  expenseId: string,
  userId: string,
  payload: CreateGroupExpenseInput,
) {
  await ensureActiveMembership(groupId, userId);
  const existingItems = await docClient
    .scan({
      TableName: GROUP_EXPENSES_TABLE_NAME,
      FilterExpression: 'groupId = :groupId AND expenseId = :expenseId',
      ExpressionAttributeValues: {
        ':groupId': groupId,
        ':expenseId': expenseId,
      },
    })
    .promise();
  const existing = (existingItems.Items || [])[0] as GroupExpenseItem | undefined;
  if (!existing) {
    throw new Error('Group expense not found.');
  }

  const updated: GroupExpenseItem = {
    ...existing,
    title: normalize(payload.title),
    amount: Number(Number(payload.amount || 0).toFixed(2)),
    category: normalize(payload.category),
    date: String(payload.date),
    notes: normalize(payload.notes),
    split: payload.split,
    createdBy: existing.createdBy || userId,
    createdAt: existing.createdAt || nowIso(),
  };
  await docClient
    .put({ TableName: GROUP_EXPENSES_TABLE_NAME, Item: updated })
    .promise();
  return updated;
}

export async function deleteGroupExpense(
  groupId: string,
  expenseId: string,
  userId: string,
) {
  await ensureActiveMembership(groupId, userId);
  const existingItems = await docClient
    .scan({
      TableName: GROUP_EXPENSES_TABLE_NAME,
      FilterExpression: 'groupId = :groupId AND expenseId = :expenseId',
      ExpressionAttributeValues: {
        ':groupId': groupId,
        ':expenseId': expenseId,
      },
    })
    .promise();
  const existing = (existingItems.Items || [])[0] as GroupExpenseItem | undefined;
  if (!existing) {
    throw new Error('Group expense not found.');
  }

  const candidateKeys: Array<Record<string, string>> = [
    { groupId: existing.groupId, expenseId: existing.expenseId },
    { expenseId: existing.expenseId },
    { groupId: existing.groupId },
  ];

  const errors: string[] = [];
  for (const key of candidateKeys) {
    try {
      await docClient
        .delete({
          TableName: GROUP_EXPENSES_TABLE_NAME,
          Key: key,
        })
        .promise();
      return;
    } catch (error: any) {
      const message = String(error?.message || 'Unknown delete error');
      errors.push(`${JSON.stringify(key)} => ${message}`);
      const isKeyMismatch =
        /provided key element does not match the schema/i.test(message) ||
        /the provided key element does not match the schema/i.test(message);
      if (!isKeyMismatch) {
        throw error;
      }
    }
  }

  throw new Error(
    `Unable to delete group expense due to key schema mismatch. Attempts: ${errors.join(
      ' | ',
    )}`,
  );
}

export async function listGroupExpenses(groupId: string, userId: string) {
  await ensureActiveMembership(groupId, userId);
  const response = await docClient
    .scan({
      TableName: GROUP_EXPENSES_TABLE_NAME,
      FilterExpression: 'groupId = :groupId',
      ExpressionAttributeValues: { ':groupId': groupId },
    })
    .promise();
  const items = (response.Items || []) as GroupExpenseItem[];
  return items.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export async function getGroupBalances(groupId: string, userId: string) {
  const activeMembership = await ensureActiveMembership(groupId, userId);
  const members = await getGroupMembers(groupId, userId);
  const expenses = await listGroupExpenses(groupId, userId);

  const normalizeKey = (value: unknown) =>
    String(value || '')
      .trim()
      .toLowerCase();

  const resolveAliasToCanonical = new Map<string, string>();
  const canonicalLabelByKey = new Map<string, string>();
  members.forEach((member) => {
    const canonicalKey = normalizeKey(
      member.name || member.email || member.userId,
    );
    if (!canonicalKey) return;
    canonicalLabelByKey.set(
      canonicalKey,
      member.name || member.email || member.userId,
    );
    [member.name, member.email, member.userId].forEach((alias) => {
      const normalized = normalizeKey(alias);
      if (normalized) resolveAliasToCanonical.set(normalized, canonicalKey);
    });
  });
  const toCanonicalKey = (value: unknown) => {
    const normalized = normalizeKey(value);
    return resolveAliasToCanonical.get(normalized) || normalized;
  };

  const balances: Record<string, number> = {};
  members.forEach((member) => {
    const key = toCanonicalKey(member.name || member.email || member.userId);
    if (key) balances[key] = 0;
  });

  expenses.forEach((expense) => {
    const payerKey = toCanonicalKey(expense.split?.paidBy);
    const shares = Array.isArray(expense.split?.shares)
      ? expense.split.shares
      : [];
    shares.forEach((share) => {
      const participantKey = toCanonicalKey(share.participant);
      const amount = Number(share.amount || 0);
      if (!participantKey || !Number.isFinite(amount)) return;
      balances[participantKey] = (balances[participantKey] || 0) - amount;
      if (payerKey) {
        balances[payerKey] = (balances[payerKey] || 0) + amount;
      }
    });
  });

  const net = Object.entries(balances).map(([memberKey, amount]) => ({
    member: canonicalLabelByKey.get(memberKey) || memberKey,
    memberKey,
    amount: Number(amount.toFixed(2)),
  }));
  const currentMemberKey = toCanonicalKey(
    activeMembership.name ||
      activeMembership.email ||
      activeMembership.userId ||
      userId,
  );
  const currentMemberAmount =
    net.find((item) => item.memberKey === currentMemberKey)?.amount || 0;
  const youOwe = currentMemberAmount < 0 ? Math.abs(currentMemberAmount) : 0;
  const youAreOwed = currentMemberAmount > 0 ? currentMemberAmount : 0;

  return {
    currentMemberKey,
    summary: {
      totalExpenses: Number(
        expenses
          .reduce((sum, item) => sum + Number(item.amount || 0), 0)
          .toFixed(2),
      ),
      youOwe: Number(youOwe.toFixed(2)),
      youAreOwed: Number(youAreOwed.toFixed(2)),
      net: Number((youAreOwed - youOwe).toFixed(2)),
    },
    net: net.map((item) => ({ member: item.member, amount: item.amount })),
  };
}
