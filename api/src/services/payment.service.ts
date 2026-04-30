import type { Request } from 'express';
import { getSocketIo } from '../realtime/socket';
import * as userService from './user.service';
import * as groupService from './group.service';

const PAYMENT_BASE_URL = String(
  process.env.LOAN_TRACK_API_BASE_URL ||
    'https://b32e-106-219-166-208.ngrok-free.app/v1',
).replace(/\/+$/, '');
const APP_KEY = String(
  process.env.LOAN_TRACK_APP_KEY ||
    'd88d63b4865ed1267a42d5aa5910bd2b42cde033459b93bb17e30156f058268b',
).trim();

type VerifyResponseData = {
  toUserId?: string;
  fromUserId?: string;
  toEmail?: string;
  fromEmail?: string;
};

type PaymentState = {
  status: string;
  updatedAt: string;
  message?: string;
  transactionId?: string;
};

const paymentStatusStore = new Map<string, PaymentState>();
const transactionPartiesStore = new Map<
  string,
  { fromUserId: string; toUserId: string }
>();
const transactionSettlementStore = new Map<
  string,
  { groupId: string; fromMember: string; toMember: string; amount: number; initiatedBy: string }
>();

const normalize = (value: unknown) => String(value || '').trim();
const makeStatusKey = (fromUserId: string, toUserId: string) =>
  `${normalize(fromUserId)}::${normalize(toUserId)}`;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(
      String(
        (body as any)?.message ||
          (body as any)?.error ||
          `Upstream request failed (${response.status})`,
      ),
    );
  }
  return body as T;
}

export async function verifyUsersByEmail(params: {
  toEmail: string;
  fromEmail: string;
}) {
  const payload = {
    toEmail: normalize(params.toEmail).toLowerCase(),
    fromEmail: normalize(params.fromEmail).toLowerCase(),
  };
  if (!payload.toEmail || !payload.fromEmail) {
    throw new Error('Both toEmail and fromEmail are required.');
  }

  const response = await fetchJson<{ data?: VerifyResponseData }>(
    `${PAYMENT_BASE_URL}/users/verify`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-key': APP_KEY,
      },
      body: JSON.stringify(payload),
    },
  );
  const data = response?.data || {};
  const fromUserId = normalize(data.fromUserId);
  const toUserId = normalize(data.toUserId);
  const fromEmail = normalize(
    data.fromEmail || payload.fromEmail,
  ).toLowerCase();
  const toEmail = normalize(data.toEmail || payload.toEmail).toLowerCase();

  if (fromUserId && fromEmail) {
    await userService.updateUserLoanTrackByEmail(fromEmail, fromUserId, true);
  }
  if (toUserId && toEmail) {
    await userService.updateUserLoanTrackByEmail(toEmail, toUserId, true);
  }

  return {
    toUserId,
    fromUserId,
    toEmail,
    fromEmail,
    isVerified: Boolean(toUserId && fromUserId),
  };
}

function getBearerFromRequest(req: Request) {
  const header = String(req.headers.authorization || '').trim();
  return header.startsWith('Bearer ') ? header : '';
}

export async function initiatePayment(
  req: Request,
  payload: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    note?: string;
    groupId?: string;
    fromMember?: string;
    toMember?: string;
  },
) {
  const bearer = getBearerFromRequest(req);
  if (!bearer) {
    throw new Error('Authorization bearer token is required.');
  }
  const body = {
    fromUserId: normalize(payload.fromUserId),
    toUserId: normalize(payload.toUserId),
    amount: Number(payload.amount || 0),
    note: normalize(payload.note || 'Borrow'),
    callbackUrl: `${String(process.env.WEBHOOK_URL || '').replace(/\/+$/, '')}/api/users/registration-webhook`,
  };
  console.log('body=================', body);
  if (!body.fromUserId || !body.toUserId || !(body.amount > 0)) {
    throw new Error('fromUserId, toUserId and positive amount are required.');
  }

  const response = await fetchJson<any>(
    `${PAYMENT_BASE_URL}/payments/initiate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-key': APP_KEY,
      },
      body: JSON.stringify(body),
    },
  );

  const transactionId = normalize(
    response?.transactionId ||
      response?.data?.transactionId ||
      response?.data?.id ||
      response?.id,
  );
  if (transactionId) {
    transactionPartiesStore.set(transactionId, {
      fromUserId: body.fromUserId,
      toUserId: body.toUserId,
    });
    await userService.updateUsersPaymentStateByLoanTrackIds(
      [body.fromUserId, body.toUserId],
      transactionId,
      'INITIATED',
    );
    if (payload.groupId && payload.fromMember && payload.toMember) {
      transactionSettlementStore.set(transactionId, {
        groupId: normalize(payload.groupId),
        fromMember: normalize(payload.fromMember),
        toMember: normalize(payload.toMember),
        amount: Number(Number(payload.amount || 0).toFixed(2)),
        initiatedBy: String((req as Request & { authUserId?: string }).authUserId || ''),
      });
    }
  }

  const key = makeStatusKey(body.fromUserId, body.toUserId);
  paymentStatusStore.set(key, {
    status: 'initiated',
    updatedAt: new Date().toISOString(),
    transactionId: transactionId || undefined,
  });

  return response;
}

export async function savePaymentWebhookStatus(payload: {
  transactionId?: string;
  fromUserId?: string;
  toUserId?: string;
  status: string;
  message?: string;
}) {
  const transactionId = normalize(payload.transactionId);
  let fromUserId = normalize(payload.fromUserId);
  let toUserId = normalize(payload.toUserId);
  const status = normalize(payload.status).toLowerCase() || 'unknown';
  const message = normalize(payload.message);

  if ((!fromUserId || !toUserId) && transactionId) {
    const parties = transactionPartiesStore.get(transactionId);
    if (parties) {
      fromUserId = parties.fromUserId;
      toUserId = parties.toUserId;
    } else {
      const matchedUsers = await userService.getUsersByTransactionId(transactionId);
      const loanTrackIds = matchedUsers
        .map((user) => normalize(user.loanTrackId))
        .filter(Boolean);
      if (loanTrackIds.length >= 2) {
        fromUserId = fromUserId || loanTrackIds[0];
        toUserId = toUserId || loanTrackIds[1];
      }
    }
  }

  if (transactionId) {
    await userService.updateUsersPaymentStateByTransactionId(
      transactionId,
      status.toUpperCase(),
    );
  }

  if (transactionId && (status === 'success' || status === 'completed')) {
    const settlement = transactionSettlementStore.get(transactionId);
    if (settlement?.groupId && settlement?.fromMember && settlement?.toMember) {
      const settleByUserId = settlement.initiatedBy || normalize(payload.fromUserId);
      if (settleByUserId) {
        await groupService.settleGroupPayment({
          groupId: settlement.groupId,
          userId: settleByUserId,
          fromMember: settlement.fromMember,
          toMember: settlement.toMember,
          amount: settlement.amount,
        });
      }
    }
  }

  const key = makeStatusKey(fromUserId, toUserId);
  const state: PaymentState = {
    status,
    updatedAt: new Date().toISOString(),
    message: message || undefined,
    transactionId: transactionId || undefined,
  };
  paymentStatusStore.set(key, state);

  const io = getSocketIo();
  if (io) {
    io.to(`user:${fromUserId}`).emit('payment-status', {
      toUserId,
      fromUserId,
      ...state,
    });
    io.to(`user:${toUserId}`).emit('payment-status', {
      toUserId,
      fromUserId,
      ...state,
    });
  }

  return state;
}

export function getPaymentStatus(fromUserId: string, toUserId: string) {
  const key = makeStatusKey(fromUserId, toUserId);
  return (
    paymentStatusStore.get(key) || {
      status: 'pending',
      updatedAt: new Date().toISOString(),
    }
  );
}
