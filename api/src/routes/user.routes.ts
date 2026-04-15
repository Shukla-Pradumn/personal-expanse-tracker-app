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

//this is for get the user by id
router.get(
  '/:userId',
  validate(getUserParamsSchema, 'params'),
  verifySameUser('params', 'userId'),
  userController.getUser,
);

//this is for update/create the user
router.post(
  '/',
  validate(upsertUserBodySchema, 'body'),
  verifySameUser('body', 'userId'),
  userController.upsertUser,
);

export default router;
