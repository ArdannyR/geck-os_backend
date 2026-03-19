import axios from "axios";
import User from "../models/User.js"; 
import Recommendation from "../models/Recommendation.js"; 
import { uploadBase64ToCloudinary } from "../helpers/cloudinary.js"; 

export const chatWithAssistant = async (req, res) => {
    try {
        const { mensaje } = req.body;

        if (!mensaje) {
            return res.status(400).json({ ok: false, msg: "El mensaje es obligatorio" });
        }

        const pythonUrl = `${process.env.PYTHON_MICROSERVICE_URL}/chat`; 

        const response = await axios.post(
            pythonUrl, 
            { mensaje },
            { timeout: 120000 }
        );

        // El backend de Python nos devuelve un objeto con "respuesta" y "metricas"
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

        // Llamamos a la ruta exacta de tu compañero
        const pythonUrl = `${process.env.PYTHON_MICROSERVICE_URL}/generar-fondo`;

        const response = await axios.post(
            pythonUrl,
            { descripcion: prompt }, // Tu compañero le puso "descripcion" en lugar de "prompt"
            { timeout: 120000 }
        );

        // Tu compañero devuelve la imagen en el campo "imagen"
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
        const { consulta, archivos } = req.body;

        if (!consulta || !archivos) {
            return res.status(400).json({ ok: false, msg: "Falta la consulta o los archivos" });
        }

        const pythonUrl = `${process.env.PYTHON_MICROSERVICE_URL}/buscar`;

        const response = await axios.post(pythonUrl, { consulta, archivos });

        return res.status(200).json({
            ok: true,
            resultados: response.data.resultados
        });

    } catch (error) {
        console.error("❌ Error en semanticSearch:", error.message);
        return res.status(500).json({ ok: false, msg: "Error en la búsqueda semántica" });
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
}