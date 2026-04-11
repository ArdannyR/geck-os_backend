import jwt from "jsonwebtoken";

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