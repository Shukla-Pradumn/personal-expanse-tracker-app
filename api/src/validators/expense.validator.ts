import Joi from 'joi';

//this is for get the expenses by user id
export const getExpensesQuerySchema = Joi.object({
  userId: Joi.string().trim().default('demo-user'),
});

//this is for create the expense
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
