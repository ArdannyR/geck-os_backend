import { Router } from 'express';
import { getProfile, updatePassword, updateProfile, updatePreferences, updateImage } from '../controllers/user_controller.js';
import { verifyAuth } from '../middlewares/auth.js';

const router = Router();
router.use(verifyAuth);

router.get('/profile', getProfile);
router.put('/update-password', updatePassword); 
router.put('/profile/:id', updateProfile);           
router.patch('/preferences', updatePreferences);
router.post('/update-image', updateImage);

export default router;