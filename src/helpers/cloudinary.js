import { v2 as cloudinary } from "cloudinary";
import fs from "fs-extra";

/**
 * Sube un archivo físico (temporal) a Cloudinary y lo elimina del servidor local.
 */
export const uploadFileToCloudinary = async (filePath, folder = "VirtualDesk_Files") => {
    try {
        const result = await cloudinary.uploader.upload(filePath, { 
            folder: folder,
            resource_type: "auto", 
            use_filename: true,
            unique_filename: true
        });

        // Borramos el archivo temporal del servidor
        await fs.unlink(filePath);
        
        return { 
            secure_url: result.secure_url, 
            public_id: result.public_id,
            format: result.format,      
            resource_type: result.resource_type 
        };

    } catch (error) {
        await fs.unlink(filePath).catch(() => {}); 
        throw error;
    }
};

/**
 * Sube una imagen en formato Base64 (típico de IAs generativas) a Cloudinary.
 */
export const uploadBase64ToCloudinary = async (base64, folder = "VirtualDesk_AI") => {
    const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    
    const { secure_url } = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ 
            folder, 
            resource_type: 'auto' 
        }, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
        stream.end(buffer);
    });
    
    return secure_url;
};