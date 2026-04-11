import { Router } from "express";
import { improveText, chatWithAssistant, generateWallpaper, getRecommendations, semanticSearch } from "../controllers/ai_controller.js";
import { verifyAuth } from "../middlewares/auth.js";

const router = Router();
router.use(verifyAuth);

router.post("/improve-text", improveText);
router.post("/chat", chatWithAssistant);
router.post("/semantic-search", semanticSearch);
router.post("/generate-wallpaper", generateWallpaper);
router.get("/recommendations", getRecommendations);

export default router;