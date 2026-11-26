import { Router } from 'express';
import { currentUser, login, logout, register, requestPasswordReset, resetPassword } from '../controllers/authController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/access.js';
import { passwordResetLimiter } from '../middleware/rateLimits.js';

const router = Router();
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/forgot-password', passwordResetLimiter, asyncHandler(requestPasswordReset));
router.post('/reset-password', asyncHandler(resetPassword));
router.get('/me', requireAuth, currentUser);
router.post('/logout', requireAuth, logout);
export default router;
