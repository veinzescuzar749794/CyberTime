import { Router } from 'express';
import { createAccount, listAccounts, recordCashTopUp } from '../controllers/userController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth, requireRoles } from '../middleware/access.js';

const router = Router();
router.use(requireAuth, requireRoles('CASHIER', 'ADMIN'));
router.get('/', asyncHandler(listAccounts));
router.post('/', asyncHandler(createAccount));
router.post('/:id/topups', asyncHandler(recordCashTopUp));
export default router;
