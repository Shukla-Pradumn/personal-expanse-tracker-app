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
});

//this is for get the user by id
export const getUserParamsSchema = Joi.object({
  userId: Joi.string().trim().required(),
});
