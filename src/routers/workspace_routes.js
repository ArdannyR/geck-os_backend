import { Router } from "express";
import { createWorkspace, inviteMember } from "../controllers/workspace_controller.js";
import { verifyAuth } from "../middlewares/auth.js";

const router = Router();
router.use(verifyAuth);

router.post("/", createWorkspace);
router.post("/invite", inviteMember);

export default router;