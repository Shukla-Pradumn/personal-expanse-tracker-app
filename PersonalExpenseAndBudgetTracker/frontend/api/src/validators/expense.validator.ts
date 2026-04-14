import Joi from 'joi';

export const getExpensesQuerySchema = Joi.object({
  userId: Joi.string().trim().default('demo-user'),
});

export const createExpenseBodySchema = Joi.object({
  id: Joi.string().trim().required(),
  title: Joi.string().trim().required(),
  amount: Joi.number().positive().required(),
  category: Joi.string().trim().required(),
  date: Joi.string().trim().isoDate().required(),
  expenseDate: Joi.string().trim().isoDate().optional(),
  notes: Joi.string().allow('').default(''),
  userId: Joi.string().trim().default('demo-user'),
});
