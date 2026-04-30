import Joi from 'joi';

export const verifyUsersBodySchema = Joi.object({
  toEmail: Joi.string().trim().email().required(),
});

export const initiatePaymentBodySchema = Joi.object({
  fromUserId: Joi.string().trim().required(),
  toUserId: Joi.string().trim().required(),
  amount: Joi.number().positive().required(),
  note: Joi.string().trim().allow('').optional(),
  groupId: Joi.string().trim().allow('').optional(),
  fromMember: Joi.string().trim().allow('').optional(),
  toMember: Joi.string().trim().allow('').optional(),
});

export const paymentStatusParamsSchema = Joi.object({
  fromUserId: Joi.string().trim().required(),
  toUserId: Joi.string().trim().required(),
});

export const paymentWebhookBodySchema = Joi.object({
  transactionId: Joi.string().trim().optional(),
  fromUserId: Joi.string().trim().optional(),
  toUserId: Joi.string().trim().optional(),
  status: Joi.string().trim().required(),
  message: Joi.string().trim().allow('').optional(),
}).or('transactionId', 'fromUserId');

