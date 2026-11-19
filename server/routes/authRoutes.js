import { Router } from 'express';
import { currentUser, login, logout, register } from '../controllers/authController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/access.js';

const router = Router();
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', requireAuth, currentUser);
router.post('/logout', requireAuth, logout);
export default router;
