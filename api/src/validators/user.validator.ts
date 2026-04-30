import Joi from 'joi';

//this is for update/create the user
export const upsertUserBodySchema = Joi.object({
  userId: Joi.string().trim().required(),
  email: Joi.string().trim().email().required(),
  name: Joi.string().trim().required(),
  phone: Joi.string().trim().allow('').default(''),
  monthlyBudget: Joi.number().positive().optional(),
  savingsGoal: Joi.number().positive().optional(),
  setupCompleted: Joi.boolean().optional(),
  loanTrackId: Joi.string().trim().allow('').optional(),
  isVerified: Joi.boolean().optional(),
  lastPaymentTransactionId: Joi.string().trim().allow('').optional(),
  lastPaymentStatus: Joi.string().trim().allow('').optional(),
});

//this is for get the user by id
export const getUserParamsSchema = Joi.object({
  userId: Joi.string().trim().required(),
});

export const registrationWebhookBodySchema = Joi.object({
  transactionId: Joi.string().trim().optional(),
  timestamp: Joi.string().trim().optional(),
  fromUserId: Joi.string().trim().optional(),
  toUserId: Joi.string().trim().optional(),
  status: Joi.string().trim().optional(),
  message: Joi.string().trim().allow('').optional(),
  data: Joi.object({
    fromUserId: Joi.string().trim().optional(),
    toUserId: Joi.string().trim().optional(),
    status: Joi.string().trim().optional(),
    message: Joi.string().trim().allow('').optional(),
  })
    .optional()
    .unknown(true),
}).unknown(true);
