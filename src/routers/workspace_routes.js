import { Router } from 'express';
import { 
    createWorkspace, 
    inviteMember 
} from '../controllers/workspace_controller.js';
import { verifyAuth } from '../middlewares/auth.js';

const router = Router();
router.use(verifyAuth);

// Rutas manteniendo compatibilidad con tu frontend
router.post("/workspaces", createWorkspace);
router.post("/workspaces/invite", inviteMember);

export default router;