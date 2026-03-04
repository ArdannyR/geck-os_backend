import { Router } from 'express';
import { 
    improveText, 
    chatWithAssistant, 
    generateWallpaper, 
    getRecommendations 
} from '../controllers/ai_controller.js';
import { verifyAuth } from '../middlewares/auth.js';

const router = Router();
router.use(verifyAuth);

// Rutas de IA (Manteniendo URLs del frontend)
router.post('/ia/improve-text', improveText);
router.post('/ia/chat', chatWithAssistant);
router.post('/ia/generate-wallpaper', generateWallpaper);
router.get("/ia/recommendations", getRecommendations);

export default router;