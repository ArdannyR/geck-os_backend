import { Router } from 'express';
import { 
    getProfile, 
    updatePassword, 
    updateProfile, 
    updatePreferences, 
    updateImage 
} from '../controllers/user_controller.js';
import { verifyAuth } from '../middlewares/auth.js';

const router = Router();
router.use(verifyAuth);

// Rutas privadas (Frontend compatibility)
router.get('/perfil', getProfile);
router.put('/estudiante/actualizarpassword', updatePassword); // Mantenemos la URL rara por compatibilidad
router.put('/estudiante/:id', updateProfile);
router.put('/preferencias', updatePreferences);
router.post('/actualizar-imagen', updateImage);

export default router;