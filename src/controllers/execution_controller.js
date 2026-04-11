import { exec } from "child_process";
import fs from "fs-extra";
import path from "path";

export const executeCode = async (req, res) => {
    try {
        const { code, language } = req.body;

        if (!code || !language) {
            return res.status(400).json({ ok: false, msg: "El código y el lenguaje son obligatorios" });
        }

        // 1. Crear carpeta temporal única
        const execId = `run_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const execDir = path.join(process.cwd(), "uploads", execId);
        
        await fs.ensureDir(execDir);

        let filePath = "";
        let command = "";
        const langStr = language.toLowerCase();

        // 🌟 LA MAGIA MULTIPLATAFORMA 🌟
        // Si es 'win32', estamos en tu PC local. Si no, asumimos que estamos en Render (Linux)
        const isWindows = process.platform === "win32";

        // 2. Configurar los comandos según el lenguaje
        if (langStr === "javascript" || langStr === "js") {
            filePath = path.join(execDir, "script.js");
            await fs.writeFile(filePath, code);
            
            // Node funciona igual en Windows y Linux
            command = `node "${filePath}"`;

        } else if (langStr === "python" || langStr === "py") {
            filePath = path.join(execDir, "script.py");
            await fs.writeFile(filePath, code);
            
            // En Windows es "python", en Linux (Render) instalamos "python3"
            const pythonCommand = isWindows ? "python" : "python3";
            command = `${pythonCommand} "${filePath}"`;

        } else if (langStr === "c++" || langStr === "cpp") {
            filePath = path.join(execDir, "main.cpp");
            await fs.writeFile(filePath, code);
            
            // En Windows el ejecutable necesita .exe, en Linux no
            const outPath = path.join(execDir, isWindows ? "main.exe" : "main");
            command = `g++ "${filePath}" -o "${outPath}" && "${outPath}"`;

        } else if (langStr === "java") {
            filePath = path.join(execDir, "Main.java");
            await fs.writeFile(filePath, code);
            
            // Java funciona igual en ambos, pero debemos entrar a la carpeta primero
            // javac compila el .java a .class, y java ejecuta el .class
            command = `cd "${execDir}" && javac Main.java && java Main`;

        } else {
            // Lenguaje no soportado (Ej. HTML, CSS, JSON)
            await fs.remove(execDir);
            return res.status(400).json({ 
                ok: false, 
                msg: "Lenguaje no soportado por el compilador del servidor. Usa JS, Python, C++ o Java." 
            });
        }

        // 3. Ejecutar el subproceso (8 segundos máximo por si C++ o Java tardan compilando)
        exec(command, { timeout: 8000 }, async (error, stdout, stderr) => {
            
            // 4. Limpieza: Borrar siempre la carpeta temporal y su contenido
            await fs.remove(execDir).catch(() => {});

            if (error) {
                return res.status(200).json({ 
                    ok: true, 
                    output: stderr || error.message || "Error de compilación o tiempo límite excedido.",
                    isError: true 
                });
            }

            // Éxito: Devolver la consola
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