import { Router } from 'express';
import { shareDesktopAccess, getDashboardInfo } from '../controllers/dashboard_controller.js';
import { verifyAuth } from '../middlewares/auth.js';

const router = Router();
router.use(verifyAuth);

router.post("/share-desktop", shareDesktopAccess);
router.get("/dashboard-data", getDashboardInfo);

export default router;