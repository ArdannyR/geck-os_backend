import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js'; // 💡 Actualizado al nuevo modelo
import dotenv from 'dotenv';
dotenv.config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        // 1. Verificar si el usuario ya existe por su Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            return done(null, user);
        }

        // 2. Si no tiene Google ID, verificamos si existe por Email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
        }

        // 3. Si no existe, CREAMOS uno nuevo
        const newUser = new User({
            name: profile.displayName, 
            email: profile.emails[0].value,
            googleId: profile.id,
            emailConfirmed: true 
        });
        
        await newUser.save();
        return done(null, newUser);

    } catch (error) {
        return done(error, null);
    }
  }
));

// Serialización
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});