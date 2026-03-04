import jwt from "jsonwebtoken";

/**
 * Crea un token JWT para el usuario.
 * No usamos fallbacks inseguros para JWT_SECRET. Si falta, la app debe fallar fuerte.
 */
export const createJWT = (id, role) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("CRITICAL: JWT_SECRET no está definido en las variables de entorno");
    }

    return jwt.sign(
        { id, role }, 
        process.env.JWT_SECRET, 
        { expiresIn: "1d" }
    );
};