import sendMail from "../config/nodemailer.js"; // Asegúrate de que este archivo exista

export const sendRegistrationEmail = (userMail, token) => {
    return sendMail(
        userMail,
        "Bienvenido a VirtualDesk - Confirma tu cuenta",
        `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h1 style="color: #4A90E2;">¡Bienvenido a VirtualDesk!</h1>
                <p>Hola, haz clic en el siguiente botón para confirmar tu cuenta y empezar a organizar tu vida digital:</p>
                <a href="${process.env.URL_FRONTEND}/confirmar/${token}" 
                   style="display: inline-block; padding: 10px 20px; background-color: #4A90E2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    Confirmar mi cuenta
                </a>
                <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
                <footer style="font-size: 12px; color: #888;">El equipo de VirtualDesk te da la más cordial bienvenida.</footer>
            </div>
        `
    );
};

export const sendPasswordRecoveryEmail = (userMail, token) => {
    return sendMail(
        userMail,
        "VirtualDesk - Recupera tu contraseña",
        `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h1 style="color: #E24A4A;">VirtualDesk</h1>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva:</p>
                <a href="${process.env.URL_FRONTEND}/reset/${token}" 
                   style="display: inline-block; padding: 10px 20px; background-color: #E24A4A; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    Restablecer mi contraseña
                </a>
                <p style="font-size: 14px; color: #666;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
                <footer style="font-size: 12px; color: #888;">El equipo de VirtualDesk.</footer>
            </div>
        `
    );
};