import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import type { UserPayloadInput } from '../models/user.model';
import * as paymentService from '../services/payment.service';

//this is for get the user by id
/**
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<void>} A promise that resolves to void.
 */
export async function getUser(req: Request, res: Response): Promise<void> {
  try {
    console.log('GET /api/users/:userId params =>', req.params);
    const item = await userService.getUserById(req.params.userId);
    if (!item) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ item });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      message: 'Failed to fetch users',
      error: message,
    });
  }
}

//this is for update/create the user
/**
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<void>} A promise that resolves to void.
 */

export async function upsertUser(req: Request, res: Response): Promise<void> {
  try {
    console.log('POST /api/users body =>', req.body);
    const item = await userService.upsertUser(req.body as UserPayloadInput);
    res.status(201).json({ item });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      message: 'Failed to save user',
      error: message,
    });
  }
}

export function registrationWebhook(req: Request, res: Response): void {
  const source = (
    req.body?.data && typeof req.body.data === 'object'
      ? req.body.data
      : req.body
  ) as Record<string, unknown>;
  console.log('registrationWebhook source =>', req.body);
  paymentService
    .savePaymentWebhookStatus({
      transactionId: String(source.transactionId || ''),
      fromUserId: String(source.fromUserId || ''),
      toUserId: String(source.toUserId || ''),
      status: String(source.status || 'unknown'),
      message: String(source.message || ''),
    })
    .then((state) => {
      res.json({ ok: true, data: state });
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: 'Failed to process webhook', error: message });
    });
}
