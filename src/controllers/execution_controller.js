import { exec } from "child_process";
import fs from "fs-extra";
import path from "path";

export const executeCode = async (req, res) => {
    try {
        const { code, language } = req.body;

        if (!code || !language) {
            return res.status(400).json({ ok: false, msg: "El código y el lenguaje son obligatorios" });
        }

        // Generar un nombre de archivo único temporal
        const fileName = `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        // Usaremos la carpeta 'uploads' que ya tienes configurada en tu app
        const uploadsDir = path.join(process.cwd(), "uploads");
        
        // Asegurarnos de que la carpeta existe
        await fs.ensureDir(uploadsDir);

        let filePath = "";
        let command = "";

        // Configurar el comando según el lenguaje
        if (language.toLowerCase() === "javascript" || language.toLowerCase() === "js") {
            filePath = path.join(uploadsDir, `${fileName}.js`);
            // Nota las comillas dobles rodeando la variable de la ruta
            command = `node "${filePath}"`; 
        } else if (language.toLowerCase() === "python" || language.toLowerCase() === "py") {
            filePath = path.join(uploadsDir, `${fileName}.py`);
            command = `python "${filePath}"`; 
        } else {
            return res.status(400).json({ ok: false, msg: "Lenguaje no soportado. Usa 'javascript' o 'python'" });
        }

        // 1. Guardar el código del usuario en el archivo físico
        await fs.writeFile(filePath, code);

        // 2. Ejecutar el archivo como un subproceso (con límite de 5 segundos)
        exec(command, { timeout: 5000 }, async (error, stdout, stderr) => {
            
            // 3. Siempre borrar el archivo temporal al terminar (pase lo que pase)
            await fs.unlink(filePath).catch(() => {});

            // Si el código del usuario tiene errores de sintaxis o hace timeout
            if (error) {
                return res.status(200).json({ 
                    ok: true, 
                    output: stderr || "Error de ejecución o tiempo límite excedido (Timeout).",
                    isError: true 
                });
            }

            // Si se ejecutó correctamente, enviamos la salida de la consola (stdout)
            return res.status(200).json({ 
                ok: true, 
                output: stdout,
                isError: false 
            });
        });

    } catch (error) {
        console.error("❌ Error en executeCode:", error);
        return res.status(500).json({ ok: false, msg: "Error interno al procesar el código" });
    }
};