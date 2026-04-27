import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import * as groupController from '../controllers/group.controller';
import {
  createGroupBodySchema,
  createGroupExpenseBodySchema,
  groupExpenseParamsSchema,
  groupIdParamsSchema,
  inviteMemberBodySchema,
} from '../validators/group.validator';

const router = Router();
router.use(requireAuth);

router.get('/', groupController.listGroups);
router.post(
  '/',
  validate(createGroupBodySchema, 'body'),
  groupController.createGroup,
);

router.post(
  '/:groupId/invite',
  validate(groupIdParamsSchema, 'params'),
  validate(inviteMemberBodySchema, 'body'),
  groupController.inviteMember,
);

router.post(
  '/:groupId/join',
  validate(groupIdParamsSchema, 'params'),
  groupController.joinGroup,
);

router.get(
  '/:groupId/members',
  validate(groupIdParamsSchema, 'params'),
  groupController.listMembers,
);

router.get(
  '/:groupId/expenses',
  validate(groupIdParamsSchema, 'params'),
  groupController.listExpenses,
);

router.post(
  '/:groupId/expenses',
  validate(groupIdParamsSchema, 'params'),
  validate(createGroupExpenseBodySchema, 'body'),
  groupController.createExpense,
);

router.put(
  '/:groupId/expenses/:expenseId',
  validate(groupExpenseParamsSchema, 'params'),
  validate(createGroupExpenseBodySchema, 'body'),
  groupController.updateExpense,
);

router.delete(
  '/:groupId/expenses/:expenseId',
  validate(groupExpenseParamsSchema, 'params'),
  groupController.deleteExpense,
);

router.get(
  '/:groupId/balances',
  validate(groupIdParamsSchema, 'params'),
  groupController.getBalances,
);

export default router;
