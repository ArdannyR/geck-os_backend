import jwt from "jsonwebtoken";
import User from "../models/User.js"; // 💡 Apuntamos al nuevo modelo

export const verifyAuth = async (req, res, next) => {
    const { authorization } = req.headers;
    
    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({ msg: "Acceso denegado: token no proporcionado o formato inválido" });
    }

    try {
        const token = authorization.split(" ")[1];
        
        // Verificamos el token. Si JWT_SECRET no existe, lanzará un error capturado por el catch.
        const { id } = jwt.verify(token, process.env.JWT_SECRET);
        
        // 💡 Buscamos en el modelo 'User'
        const userDB = await User.findById(id).lean().select("-password");
        
        if (!userDB) {
            return res.status(401).json({ msg: "Usuario no encontrado o token inválido" });
        }

        // 💡 ESTÁNDAR DE LA INDUSTRIA: Guardamos el usuario en req.user (antes era req.estudianteHeader)
        req.user = userDB;
        
        next();
    } catch (error) {
        console.error("❌ Error verificando JWT:", error.message);
        return res.status(401).json({ msg: `Token inválido o expirado` });
    }
};