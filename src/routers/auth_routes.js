import { Router } from 'express';
import passport from 'passport';
import { createJWT } from '../helpers/jwt.js';
import { 
    registerUser, 
    loginUser, 
    confirmEmail, 
    forgotPassword, 
    verifyPasswordToken,
    resetPassword 
} from '../controllers/auth_controller.js';

const router = Router();

router.post('/registro', registerUser);
router.post('/login', loginUser);
router.get('/confirmar/:token', confirmEmail);
router.post('/recuperarPassword', forgotPassword); 
router.get('/recuperarPassword/:token', verifyPasswordToken); 
router.post('/nuevoPassword/:token', resetPassword); 


// RUTAS DE AUTENTICACIÓN CON GOOGLE (PASSPORT)
router.get('/auth/google', passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false // Usamos JWT, no sesiones de servidor
}));

router.get('/auth/google/callback', 
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        // Si llega aquí, el usuario ya fue autenticado y está en req.user
        const user = req.user;

        // Creamos tu JWT usando el nuevo helper
        const token = createJWT(user._id, user.role);

        // REDIRECCIONAMOS al Frontend con el token en la URL
        // (El frontend debe leer este token de la URL, guardarlo y redirigir al escritorio)
        res.redirect(`${process.env.URL_FRONTEND}/google-success?token=${token}`);
    }
);

export default router;