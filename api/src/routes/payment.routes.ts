import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import * as paymentController from '../controllers/payment.controller';
import {
  initiatePaymentBodySchema,
  paymentStatusParamsSchema,
  paymentWebhookBodySchema,
  verifyUsersBodySchema,
} from '../validators/payment.validator';

const router = Router();

router.post(
  '/verify',
  requireAuth,
  validate(verifyUsersBodySchema, 'body'),
  paymentController.verifyUsers,
);

router.post(
  '/initiate',
  requireAuth,
  validate(initiatePaymentBodySchema, 'body'),
  paymentController.initiate,
);

router.get(
  '/status/:fromUserId/:toUserId',
  requireAuth,
  validate(paymentStatusParamsSchema, 'params'),
  paymentController.getStatus,
);

router.post(
  '/webhook',
  validate(paymentWebhookBodySchema, 'body'),
  paymentController.webhook,
);

export default router;

