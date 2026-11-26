import { Router } from 'express';
import { changePassword, getProfile, updateProfile } from '../controllers/profileController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/access.js';

const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(getProfile));
router.put('/', asyncHandler(updateProfile));
router.put('/password', asyncHandler(changePassword));
export default router;
