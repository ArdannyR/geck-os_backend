import { Router } from "express";
import { getChatHistory } from "../controllers/chat_controller.js";
import { verifyAuth } from "../middlewares/auth.js";

const router = Router();
router.use(verifyAuth);

router.get("/history/:otherUserId", getChatHistory);

export default router;