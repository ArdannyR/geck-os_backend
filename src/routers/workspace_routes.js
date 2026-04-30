import { Router } from "express";
import { createWorkspace, inviteMember, fetchUserWorkspaces } from "../controllers/workspace_controller.js";
import { verifyAuth } from "../middlewares/auth.js";

const router = Router();
router.use(verifyAuth);

router.post("/", createWorkspace);
router.get("/", fetchUserWorkspaces);
router.post("/invite", inviteMember);

export default router;