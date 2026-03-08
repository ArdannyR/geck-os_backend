import { Router } from 'express';
import { getProfile, updatePassword, updateProfile, updatePreferences, updateImage } from '../controllers/user_controller.js';
import { verifyAuth } from '../middlewares/auth.js';

const router = Router();
router.use(verifyAuth);

router.get('/perfil', getProfile);
router.put('/actualizar-password', updatePassword); 
router.put('/perfil/:id', updateProfile);         
router.patch('/preferences', updatePreferences);
router.post('/actualizar-imagen', updateImage);

export default router;