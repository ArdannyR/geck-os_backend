import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Recreando __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directorioBase = path.join(__dirname, 'src'); 
const archivoSalida = path.join(__dirname, 'contexto_frontend.txt');

const extensionesPermitidas = ['.js', '.jsx', '.ts', '.tsx', '.css'];

function leerDirectorio(directorio) {
    let contenido = '';
    const archivos = fs.readdirSync(directorio);

    archivos.forEach(archivo => {
        const rutaCompleta = path.join(directorio, archivo);
        const stat = fs.statSync(rutaCompleta);

        if (stat.isDirectory()) {
            contenido += leerDirectorio(rutaCompleta);
        } else {
            const extension = path.extname(archivo);
            if (extensionesPermitidas.includes(extension)) {
                contenido += `\n\n================================================\n`;
                contenido += `📄 Archivo: ${rutaCompleta.replace(__dirname, '')}\n`;
                contenido += `================================================\n\n`;
                contenido += fs.readFileSync(rutaCompleta, 'utf8');
            }
        }
    });
    return contenido;
}

try {
    const todoElCodigo = leerDirectorio(directorioBase);
    fs.writeFileSync(archivoSalida, todoElCodigo);
    console.log('✅ ¡Listo! Todo tu código se ha guardado en contexto_frontend.txt');
} catch (error) {
    console.error('❌ Hubo un error al leer los archivos:', error);
}