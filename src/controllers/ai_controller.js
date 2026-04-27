import axios from "axios";
import User from "../models/User.js";
import Item from "../models/item.js";
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
            { mensaje }, // El microservicio espera { mensaje: "..." }
            { timeout: 120000 }
        );

        // Retornamos el objeto 'respuesta' completo que contiene: mensaje, comando, apps
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

        const pythonUrl = `${process.env.PYTHON_MICROSERVICE_URL}/generar-fondo`;

        const response = await axios.post(
            pythonUrl,
            { descripcion: prompt }, // Python espera 'descripcion'
            { timeout: 120000 }
        );
        
        const base64Image = response.data.imagen;

        if (!base64Image) {
            return res.status(500).json({ ok: false, msg: "La IA no devolvió la imagen" });
        }

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
        return res.status(500).json({ ok: false, msg: "Error al generar imagen mediante la IA" });
    }
};

export const semanticSearch = async (req, res) => {
    try {
        const { consulta } = req.body; 
        const userId = req.user._id;

        if (!consulta) {
            return res.status(400).json({ ok: false, msg: "La consulta es obligatoria" });
        }

        const items = await Item.find({ 
            userId: userId, 
            type: { $in: ["note", "code", "file"] } // Filtrar por tipos con contenido
        });

        if (!items || items.length === 0) {
            return res.status(200).json({ ok: true, data: [] });
        }

        const archivosParaIA = items.map(item => ({
            id: item._id.toString(),
            nombre: item.name,
            // Aseguramos que 'contenido' no sea null para el modelo de IA
            contenido: item.content || `Archivo tipo ${item.type} llamado ${item.name}`
        }));

        const pythonUrl = `${process.env.PYTHON_MICROSERVICE_URL}/buscar`;

        const response = await axios.post(
            pythonUrl, 
            {
                consulta,
                archivos: archivosParaIA
            }, 
            { timeout: 120000 }
        );

        return res.status(200).json({
            ok: true,
            data: response.data.resultados // 'resultados' es el campo que usa Python
        });

    } catch (error) {
        console.error("❌ Error en semanticSearch:", error.message);
        return res.status(500).json({ ok: false, msg: "Fallo al realizar la búsqueda semántica" });
    }
};

export const improveText = async (req, res) => {
    try {
        const { texto, accion } = req.body; 

        if (!texto || !accion) {
            return res.status(400).json({ ok: false, msg: "Texto y acción son obligatorios" });
        }

        const pythonUrl = `${process.env.PYTHON_MICROSERVICE_URL}/analizar-documento`;

        const response = await axios.post(
            pythonUrl,
            { texto, accion }, 
            { timeout: 120000 }
        );

        return res.status(200).json({
            ok: true,
            data: response.data 
        });

    } catch (error) {
        console.error("❌ Error en improveText:", error.message);
        return res.status(500).json({ ok: false, msg: "No se pudo procesar el análisis del texto" });
    }
};