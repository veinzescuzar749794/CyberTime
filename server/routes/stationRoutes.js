import { Router } from 'express';
import { addStation, cashTopUpByStation, listStations } from '../controllers/stationController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth, requireRoles } from '../middleware/access.js';

const router = Router();
router.use(requireAuth);
router.get('/', requireRoles('CASHIER','ADMIN'), asyncHandler(listStations));
router.post('/', requireRoles('ADMIN'), asyncHandler(addStation));
router.post('/:pcId/topups', requireRoles('CASHIER','ADMIN'), asyncHandler(cashTopUpByStation));
export default router;
