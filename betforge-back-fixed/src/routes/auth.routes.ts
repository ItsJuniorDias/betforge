import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { authRateLimit } from '../middlewares/rateLimit.js';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.validator.js';

const router = Router();

// POST /api/v1/auth/register
router.post(
  '/register',
  authRateLimit,
  validate(registerSchema),
  AuthController.register
);

// POST /api/v1/auth/login
router.post(
  '/login',
  authRateLimit,
  validate(loginSchema),
  AuthController.login
);

// POST /api/v1/auth/refresh
router.post(
  '/refresh',
  validate(refreshSchema),
  AuthController.refresh
);

// POST /api/v1/auth/logout
router.post('/logout', authenticate, AuthController.logout);

// GET /api/v1/auth/me
router.get('/me', authenticate, AuthController.me);

export default router;
