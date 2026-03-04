import axios from "axios";
import { InferenceClient } from "@huggingface/inference";
import User from "../models/User.js"; 
import Recommendation from "../models/Recommendation.js"; 
import { uploadBase64ToCloudinary } from "../helpers/cloudinary.js"; 

const hf = new InferenceClient(process.env.HF_API_KEY);

export const improveText = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ msg: "Texto requerido" });

        const url = "https://api-inference.huggingface.com/models/facebook/bart-large-cnn";

        const response = await axios.post(
            url,
            { inputs: `Improve the following text in Spanish:\n\n${text}` },
            {
                headers: {
                    Authorization: `Bearer ${process.env.HF_API_KEY}`,
                    "Content-Type": "application/json",
                },
                timeout: 60000,
            }
        );

        const improved = response.data?.[0]?.generated_text ?? response.data;
        return res.status(200).json({ ok: true, improvedText: improved });

    } catch (error) {
        console.error("❌ Error en improveText:", error.message);
        return res.status(500).json({ msg: "Error IA", error: error.message });
    }
};

export const chatWithAssistant = async (req, res) => {
    try {
        const { mensaje } = req.body;

        if (!mensaje) {
            return res.status(400).json({ ok: false, msg: "El mensaje es obligatorio" });
        }

        const pythonUrl = process.env.PYTHON_MICROSERVICE_URL; 

        if (!pythonUrl) {
            return res.status(500).json({ ok: false, msg: "Error de configuración: Falta PYTHON_MICROSERVICE_URL" });
        }

        const response = await axios.post(
            pythonUrl, 
            { mensaje },
            { timeout: 120000 }
        );

        return res.status(200).json({
            ok: true,
            data: response.data 
        });

    } catch (error) {
        console.error("❌ Error en chatWithAssistant:", error.message);
        
        if (error.code === 'ECONNREFUSED' || error.response?.status >= 500) {
            return res.status(503).json({ ok: false, msg: "El asistente IA no está disponible en este momento." });
        }
        
        return res.status(500).json({ ok: false, msg: "Error interno del servidor" });
    }
};

export const generateWallpaper = async (req, res) => {
    try {
        const userId = req.user._id; // 💡 Actualizado
        const { prompt } = req.body;

        if (!prompt) return res.status(400).json({ ok: false, msg: "El prompt es obligatorio" });

        console.log(`🎨 Generando fondo SDXL para: "${prompt}"`);

        const imageBlob = await hf.textToImage({
            model: "stabilityai/stable-diffusion-xl-base-1.0",
            inputs: prompt,
            provider: "hf-inference", 
            parameters: { 
                negative_prompt: "blurry, low quality, distortion" 
            }
        });

        const arrayBuffer = await imageBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

        console.log("☁️ Subiendo a Cloudinary...");
        
        // 💡 Usando el nuevo helper de Cloudinary
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
        console.error("❌ Error en generateWallpaper:", error); 

        if (error.message && (error.message.includes("503") || error.message.includes("loading"))) {
             return res.status(503).json({ 
                ok: false, 
                msg: "La IA se está despertando 😴. Espera unos segundos e intenta de nuevo." 
            });
        }

        return res.status(500).json({ ok: false, msg: "Error al generar imagen IA", error: error.message });
    }
};

export const getRecommendations = async (req, res) => {
    try {
        const userId = req.user._id; // 💡 Actualizado

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