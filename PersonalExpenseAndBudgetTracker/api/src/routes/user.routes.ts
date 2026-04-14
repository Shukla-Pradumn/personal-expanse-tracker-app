import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { requireAuth, verifySameUser } from '../middlewares/auth';
import * as userController from '../controllers/user.controller';
import {
  upsertUserBodySchema,
  getUserParamsSchema,
} from '../validators/user.validator';

const router = Router();
router.use(requireAuth);

router.get(
  '/:userId',
  validate(getUserParamsSchema, 'params'),
  verifySameUser('params', 'userId'),
  userController.getUser,
);
router.post(
  '/',
  validate(upsertUserBodySchema, 'body'),
  verifySameUser('body', 'userId'),
  userController.upsertUser,
);

export default router;
