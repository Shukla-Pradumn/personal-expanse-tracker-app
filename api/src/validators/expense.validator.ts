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
  split: Joi.object({
    isSplit: Joi.boolean().valid(true).required(),
    splitMethod: Joi.string().valid('equal').required(),
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
  }).optional(),
  userId: Joi.string().trim().default('demo-user'),
});
