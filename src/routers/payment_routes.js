import { Router } from 'express';
import { createPaymentIntent } from '../controllers/payment_controller.js';
import { verifyAuth } from '../middlewares/auth.js';

const router = Router();
router.use(verifyAuth);

router.post("/create-intent", createPaymentIntent);

export default router;