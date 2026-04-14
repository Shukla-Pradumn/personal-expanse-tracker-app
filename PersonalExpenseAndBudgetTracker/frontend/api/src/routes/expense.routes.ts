import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { requireAuth, verifySameUser } from '../middlewares/auth';
import * as expenseController from '../controllers/expense.controller';
import {
  getExpensesQuerySchema,
  createExpenseBodySchema,
} from '../validators/expense.validator';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  validate(getExpensesQuerySchema, 'query'),
  verifySameUser('query', 'userId'),
  expenseController.listExpenses,
);
router.post(
  '/',
  validate(createExpenseBodySchema, 'body'),
  verifySameUser('body', 'userId'),
  expenseController.createExpense,
);

export default router;
