import Joi from 'joi';

export const groupIdParamsSchema = Joi.object({
  groupId: Joi.string().trim().required(),
});

export const groupExpenseParamsSchema = Joi.object({
  groupId: Joi.string().trim().required(),
  expenseId: Joi.string().trim().required(),
});

export const createGroupBodySchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
});

export const inviteMemberBodySchema = Joi.object({
  email: Joi.string().trim().email().required(),
  name: Joi.string().trim().allow('').optional(),
});

export const joinGroupBodySchema = Joi.object({
  groupId: Joi.string().trim().required(),
});

export const createGroupExpenseBodySchema = Joi.object({
  title: Joi.string().trim().required(),
  amount: Joi.number().positive().required(),
  category: Joi.string().trim().required(),
  date: Joi.string().trim().isoDate().required(),
  notes: Joi.string().allow('').default(''),
  split: Joi.object({
    isSplit: Joi.boolean().valid(true).required(),
    splitMethod: Joi.string().valid('equal', 'custom').required(),
    paidBy: Joi.string().trim().required(),
    participants: Joi.array().items(Joi.string().trim().required()).min(2),
    shares: Joi.array()
      .items(
        Joi.object({
          participant: Joi.string().trim().required(),
          amount: Joi.number().min(0).required(),
          settled: Joi.boolean().optional(),
        }),
      )
      .min(2),
  }).required(),
});
