import type { Request, Response } from 'express';
import * as paymentService from '../services/payment.service';

const getAuth = (req: Request) =>
  req as Request & {
    authUserEmail?: string;
    authUserId?: string;
  };

export async function verifyUsers(req: Request, res: Response): Promise<void> {
  try {
    const auth = getAuth(req);
    const fromEmail = String(auth.authUserEmail || '')
      .trim()
      .toLowerCase();
    if (!fromEmail) {
      res.status(400).json({ message: 'Authenticated user email not found.' });
      return;
    }
    const toEmail = String(req.body?.toEmail || '')
      .trim()
      .toLowerCase();
    console.log('==================', fromEmail, toEmail);
    const data = await paymentService.verifyUsersByEmail({
      fromEmail,
      toEmail,
    });
    console.log('data==================', data);
    res.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to verify users', error: message });
  }
}

export async function initiate(req: Request, res: Response): Promise<void> {
  try {
    const data = await paymentService.initiatePayment(req, req.body || {});
    res.status(201).json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = /required/i.test(message) ? 400 : 500;
    res
      .status(status)
      .json({ message: 'Failed to initiate payment', error: message });
  }
}

export function getStatus(req: Request, res: Response): void {
  const state = paymentService.getPaymentStatus(
    String(req.params.fromUserId || ''),
    String(req.params.toUserId || ''),
  );
  res.json({ data: state });
}

export async function webhook(req: Request, res: Response): Promise<void> {
  try {
    const state = await paymentService.savePaymentWebhookStatus(req.body || {});
    res.json({ data: state });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res
      .status(500)
      .json({ message: 'Failed to process webhook', error: message });
  }
}
