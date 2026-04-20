import axios from "axios";
import User from "../models/User.js";
import Recommendation from "../models/Recommendation.js";
import Item from "../models/item.js";
import { uploadBase64ToCloudinary } from "../helpers/cloudinary.js";

export const chatWithAssistant = async (req, res) => {
    try {
        const { mensaje } = req.body;

        if (!mensaje) {
            return res.status(400).json({ ok: false, msg: "El mensaje es obligatorio" });
        }

        const pythonUrl = `${process.env.PYTHON_MICROSERVICE_URL}/chat`;
        console.log("👉 Intentando conectar con Python en:", pythonUrl);

        const response = await axios.post(
            pythonUrl,
            { mensaje },
            { timeout: 120000 }
        );
        return res.status(200).json({
            ok: true,
            data: response.data.respuesta
        });

    } catch (error) {
        console.error("❌ Error en chatWithAssistant:", error.message);
        return res.status(500).json({ ok: false, msg: "El asistente IA no está disponible en este momento." });
    }
};

export const generateWallpaper = async (req, res) => {
    try {
        const userId = req.user._id;
        const { prompt } = req.body;

        if (!prompt) return res.status(400).json({ ok: false, msg: "El prompt es obligatorio" });

        console.log(`🎨 Solicitando fondo al microservicio para: "${prompt}"`);

        const pythonUrl = `${process.env.PYTHON_MICROSERVICE_URL}/generar-fondo`;
        console.log("👉 Intentando conectar con Python en:", pythonUrl);

        const response = await axios.post(
            pythonUrl,
            { descripcion: prompt },
            { timeout: 120000 }
        );
        const base64Image = response.data.imagen;

        if (!base64Image) {
            return res.status(500).json({ ok: false, msg: "El microservicio no devolvió la imagen correctamente" });
        }

        console.log("☁️ Subiendo a Cloudinary...");
        const secure_url = await uploadBase64ToCloudinary(base64Image, "VirtualDesk_Wallpapers");

        await User.findByIdAndUpdate(userId, {
            "preferences.wallpaperUrl": secure_url
        });

        const io = req.app.get("io");
        if (io) {
            io.to(`user:${userId}`).emit("preferences-updated", {
                theme: "light",
                wallpaperUrl: secure_url
            });
        }

        return res.status(200).json({ ok: true, msg: "Fondo generado con éxito", url: secure_url });

    } catch (error) {
        console.error("❌ Error en generateWallpaper:", error.message);
        return res.status(500).json({ ok: false, msg: "Error al generar imagen mediante el microservicio" });
    }
};

export const semanticSearch = async (req, res) => {
    try {
        const { consulta } = req.body; 
        const userId = req.user._id; // Corregido a _id para coincidir con tu auth

        if (!consulta) {
            return res.status(400).json({ ok: false, msg: "La consulta es obligatoria" });
        }

        // 1. Buscamos todos los ítems del usuario
        const items = await Item.find({ 
            user: userId, 
            deletedAt: null 
        });

        if (!items || items.length === 0) {
            return res.status(200).json({
                ok: true,
                msg: "No se encontraron archivos para buscar",
                data: [] 
            });
        }

        // 2. Mapeamos los datos para Python
        const archivosParaIA = items.map(item => ({
            id: item._id.toString(),
            nombre: item.name,
            contenido: item.content || `Archivo tipo ${item.type} llamado ${item.name}`
        }));

        const pythonUrl = `${process.env.PYTHON_MICROSERVICE_URL}/buscar`;
        console.log("👉 Intentando conectar con Python en:", pythonUrl);

        // 3. Consumimos el microservicio
        const response = await axios.post(
            pythonUrl, 
            {
                consulta,
                archivos: archivosParaIA
            }, 
            { timeout: 120000 }
        );

        // 4. Retornamos con la misma estructura que chatWithAssistant
        return res.status(200).json({
            ok: true,
            data: response.data.resultados // Tu IA en Python devuelve "resultados"
        });

    } catch (error) {
        console.error("❌ Error en semanticSearch:", error.message);
        return res.status(500).json({ 
            ok: false, 
            msg: "Fallo al realizar la búsqueda semántica" 
        });
    }
};

export const getRecommendations = async (req, res) => {
    try {
        const userId = req.user._id;

        const recs = await Recommendation.find({ userId })
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();

        return res.status(200).json({ ok: true, recommendations: recs });
    } catch (error) {
        console.error("❌ Error en getRecommendations:", error);
        return res.status(500).json({ ok: false, msg: "Error en el servidor" });
    }
};

export const improveText = async (req, res) => {
    res.status(200).json({ ok: true, msg: "Función de mejora de texto aún no implementada" });
};