import User from "../models/User.js";
import Item from "../models/item.js";
import Workspace from "../models/Workspace.js";
import Recommendation from "../models/Recommendation.js";
import { uploadFileToCloudinary } from "../helpers/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

export const getProfile = (req, res) => {
    const user = req.user;

    const { token, emailConfirmed, createdAt, updatedAt, __v, password, ...profileData } = user.toObject ? user.toObject() : user;

    profileData.nombre = profileData.name;
    delete profileData.name;

    res.status(200).json(profileData);
};

export const updatePassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { passwordactual, passwordnuevo } = req.body;

        if (!passwordactual || !passwordnuevo) {
            return res.status(400).json({ msg: "Debes enviar el password actual y el nuevo" });
        }

        const userDB = await User.findById(userId);
        if (!userDB) return res.status(404).json({ msg: "Usuario no encontrado" });

        const isPasswordCorrect = await userDB.matchPassword(passwordactual);
        if (!isPasswordCorrect) return res.status(400).json({ msg: "Lo sentimos, el password actual no es correcto" });

        userDB.password = await userDB.encryptPassword(passwordnuevo);
        await userDB.save();

        res.status(200).json({ msg: "Password actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ msg: `Error en el servidor - ${error.message}` });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, name, email } = req.body;
        const finalName = nombre || name;

        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: `ID inválido: ${id}` });

        const userDB = await User.findById(id);
        if (!userDB) return res.status(404).json({ msg: `No existe el usuario con ID ${id}` });

        if (Object.values(req.body).includes("")) return res.status(400).json({ msg: "Debes llenar todos los campos" });

        if (userDB.email !== email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ msg: `El email ya se encuentra registrado` });
            }
        }

        userDB.name = finalName ?? userDB.name;
        userDB.email = email ?? userDB.email;
        await userDB.save();

        res.status(200).json({ msg: "Perfil actualizado correctamente", user: userDB });
    } catch (error) {
        console.error("❌ Error en updateProfile:", error);
        res.status(500).json({ msg: `Error en el servidor - ${error.message}` });
    }
};

export const updatePreferences = async (req, res) => {
    try {
        const userId = req.user._id;
        const { theme, wallpaperUrl, accent } = req.body;

        if (theme && !["light", "dark"].includes(theme)) {
            return res.status(400).json({ ok: false, msg: "Theme inválido (light/dark)" });
        }

        const userDB = await User.findById(userId);
        if (!userDB) return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
        if (theme) userDB.preferences.theme = theme;
        if (accent) userDB.preferences.accent = accent;
        if (wallpaperUrl !== undefined) userDB.preferences.wallpaperUrl = wallpaperUrl;

        await userDB.save();

        const io = req.app.get("io");
        if (io) {
            io.to(`user:${userId}`).emit("preferences-updated", {
                theme: userDB.preferences.theme,
                accent: userDB.preferences.accent,
                wallpaperUrl: userDB.preferences.wallpaperUrl
            });
        }

        return res.status(200).json({ ok: true, msg: "Preferencias actualizadas", preferences: userDB.preferences });
    } catch (error) {
        console.error("❌ Error en updatePreferences:", error);
        return res.status(500).json({ ok: false, msg: `Error en el servidor - ${error.message}` });
    }
};

export const updateImage = async (req, res) => {
    try {
        const userId = req.user._id;

        if (!req.files || !req.files.image) {
            return res.status(400).json({ ok: false, msg: "Debes enviar un archivo en el campo 'image'" });
        }

        const file = req.files.image;

        if (!file.tempFilePath) {
            return res.status(400).json({ ok: false, msg: "Error al procesar el archivo temporal" });
        }

        const { secure_url, public_id } = await uploadFileToCloudinary(file.tempFilePath, "VirtualDesk");

        const userDB = await User.findByIdAndUpdate(
            userId,
            { $set: { "preferences.wallpaperUrl": secure_url } },
            { new: true }
        );

        return res.status(200).json({
            ok: true,
            msg: "Imagen subida correctamente",
            wallpaperUrl: secure_url,
            publicId: public_id,
            preferences: userDB?.preferences || { wallpaperUrl: secure_url }
        });
    } catch (error) {
        console.error("❌ Error en updateImage:", error);
        return res.status(500).json({ ok: false, msg: "Error en el servidor", error: error.message });
    }
};

export const deleteAccount = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user._id;
        const { confirmationText } = req.body;

        const formattedName = req.user.name.replace(/\s+/g, "");
        const expectedText = `delete_${formattedName}`;

        if (!confirmationText || confirmationText !== expectedText) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ ok: false, msg: `Confirmación incorrecta. Esperado: ${expectedText}` });
        }

        const userFiles = await Item.find({ userId, publicId: { $ne: null } }).session(session);
        for (const file of userFiles) {
            await cloudinary.uploader.destroy(file.publicId).catch(() => {});
        }

        await Item.deleteMany({ userId }).session(session);

        await Item.updateMany(
            {},
            {
                $pull: {
                    sharedWith: { userId: userId },
                    guestPositions: { userId: userId }
                }
            },
            { session }
        );

        await Workspace.deleteMany({ owner: userId }).session(session);
        await Workspace.updateMany(
            { members: userId },
            { $pull: { members: userId } },
            { session }
        );

        await Recommendation.deleteMany({ userId }).session(session);

        await User.updateMany(
            { savedDesktops: userId },
            { $pull: { savedDesktops: userId } },
            { session }
        );

        await User.findByIdAndDelete(userId).session(session);

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({ ok: true, msg: "Tu cuenta y todos tus datos han sido eliminados correctamente." });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("❌ Error en deleteAccount:", error);
        return res.status(500).json({ ok: false, msg: "Hubo un error al intentar eliminar la cuenta." });
    }
};