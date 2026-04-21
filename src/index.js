import app from "./app.js";
import connection from "./database.js";
import http from "http";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";

const startServer = async () => {
    await connection();

    const server = http.createServer(app);
    const io = new Server(server, { cors: { origin: "*" } });

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 250,
        message: { msg: "Exceso de peticiones." }
    });
    app.use(limiter);

    app.set("io", io);

    io.on("connection", (socket) => {
        console.log("✅ Socket conectado:", socket.id);

        socket.on("join-user-room", (userId) => {
            socket.join(`user:${userId}`);
            console.log(`👥 Usuario unido a la sala: user:${userId}`);
        });

        socket.on("window-open", (p) => socket.to(`user:${p.userId}`).emit("window-open", p.windowData));
        socket.on("window-move", (p) => socket.to(`user:${p.userId}`).emit("window-move", { windowId: p.windowId, position: p.position }));
        socket.on("window-close", (p) => socket.to(`user:${p.userId}`).emit("window-close", { windowId: p.windowId }));
        socket.on("file-change", (p) => socket.to(`user:${p.userId}`).emit("file-change", { fileId: p.fileId, content: p.content }));
        socket.on("code-change", (p) => socket.to(`user:${p.userId}`).emit("code-change", { content: p.content, language: p.language }));

        socket.on("disconnect", () => {
            console.log("❌ Socket desconectado:", socket.id);
        });
    });

    server.listen(app.get("port"), () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${app.get("port")}`);
    });
};

startServer();