import { Router } from 'express';
import passport from 'passport';
import { createJWT } from '../helpers/jwt.js';
import { registerUser, loginUser, confirmEmail, forgotPassword, verifyPasswordToken, resetPassword } from '../controllers/auth_controller.js';

const router = Router();

router.post('/registro', registerUser);
router.post('/login', loginUser);
router.get('/confirmar/:token', confirmEmail);
router.post('/recuperarPassword', forgotPassword); 
router.get('/recuperarPassword/:token', verifyPasswordToken); 
router.post('/nuevoPassword/:token', resetPassword); 
router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
}));
router.get('/google/callback', 
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        const user = req.user;
        const token = createJWT(user._id, user.role);
        res.redirect(`${process.env.URL_FRONTEND}/google-success?token=${token}`);
    }
);

export default router;