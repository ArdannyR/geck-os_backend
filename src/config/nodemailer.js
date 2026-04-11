import nodemailer from "nodemailer";
import Transport from "nodemailer-brevo-transport";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport(
    new Transport({
        apiKey: process.env.BREVO_API_KEY
    })
);

transporter.verify(function (error, success) {
    if (error) {
        console.log("❌ Error de conexión con Brevo API:", error);
    } else {
        console.log("✅ Servidor listo para enviar correos (Vía API Puerto 443)");
    }
});

const sendMail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"VirtualDesk" <${process.env.USER_MAILTRAP}>`,
            to,
            subject,
            html,
        });
        console.log("✅ Email enviado ID:", info.messageId);

    } catch (error) {
        console.error("❌ Error enviando email:", error.message);
    }
};

export default sendMail;