import axios from "axios";
import User from "../models/User.js"; 
import Recommendation from "../models/Recommendation.js"; 
import { uploadBase64ToCloudinary } from "../helpers/cloudinary.js"; 

const getMicroserviceHeaders = () => {
    return {
        headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.PYTHON_MICROSERVICE_API_KEY
        }
    };
};

export const improveText = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ msg: "Texto requerido" });

        const url = `${process.env.PYTHON_MICROSERVICE_URL}/ai/improve-text`;

        const response = await axios.post(
            url,
            { text }, 
            getMicroserviceHeaders()
        );

        const improved = response.data.improvedText;
        return res.status(200).json({ ok: true, improvedText: improved });

    } catch (error) {
        console.error("❌ Error en improveText:", error.message);
        return res.status(500).json({ msg: "Error al comunicarse con el microservicio de IA", error: error.message });
    }
};

export const chatWithAssistant = async (req, res) => {
    try {
        const { mensaje } = req.body;

        if (!mensaje) {
            return res.status(400).json({ ok: false, msg: "El mensaje es obligatorio" });
        }

        const pythonUrl = `${process.env.PYTHON_MICROSERVICE_URL}/ai/chat`; 

        if (!process.env.PYTHON_MICROSERVICE_URL) {
            return res.status(500).json({ ok: false, msg: "Falta PYTHON_MICROSERVICE_URL en .env" });
        }

        const response = await axios.post(
            pythonUrl, 
            { mensaje },
            { 
                ...getMicroserviceHeaders(), 
                timeout: 120000 
            }
        );

        return res.status(200).json({
            ok: true,
            data: response.data 
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

        const pythonUrl = `${process.env.PYTHON_MICROSERVICE_URL}/ai/generate-wallpaper`;

        const response = await axios.post(
            pythonUrl,
            { prompt },
            { 
                ...getMicroserviceHeaders(), 
                timeout: 120000 
            }
        );

        const base64Image = response.data.imageBase64;

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
        return res.status(500).json({ ok: false, msg: "Error al generar imagen mediante el microservicio", error: error.message });
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