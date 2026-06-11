import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { updateProfileSchema } from '../validators/bet.validator.js';

const router = Router();

router.use(authenticate);

// GET /api/v1/users/profile
router.get('/profile', UserController.getProfile);

// PATCH /api/v1/users/profile
router.patch('/profile', validate(updateProfileSchema), UserController.updateProfile);

// GET /api/v1/users (Admin only)
router.get('/', authorize('admin'), UserController.listAll);

export default router;
