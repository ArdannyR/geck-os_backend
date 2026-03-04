import app from "./app.js"; 
import connection from "./database.js";
import http from "http";
import { Server } from "socket.io";
import { startRecommendationsCron } from "./jobs/recommendations_cron.js";

const startServer = async () => {
  // 1. Conectar a la Base de Datos
  await connection();
  
  // 2. Iniciar tareas programadas
  startRecommendationsCron();

  // 3. Crear el servidor HTTP y vincular WebSockets
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });

  // Guardamos la instancia de io en Express por si un controlador la necesita
  app.set("io", io);

  // 4. Lógica de WebSockets
  io.on("connection", (socket) => {
    console.log("✅ Socket conectado:", socket.id);

    socket.on("join-user-room", (userId) => {
      socket.join(`user:${userId}`);
      console.log(`👥 Usuario unido a la sala: user:${userId}`);
    });

    // Eventos de colaboración sincronizada
    socket.on("window-open", (p) => socket.to(`user:${p.userId}`).emit("window-open", p.windowData));
    socket.on("window-move", (p) => socket.to(`user:${p.userId}`).emit("window-move", { windowId: p.windowId, position: p.position }));
    socket.on("window-close", (p) => socket.to(`user:${p.userId}`).emit("window-close", { windowId: p.windowId }));
    socket.on("file-change", (p) => socket.to(`user:${p.userId}`).emit("file-change", { fileId: p.fileId, content: p.content }));
    socket.on("code-change", (p) => socket.to(`user:${p.userId}`).emit("code-change", { content: p.content, language: p.language }));

    socket.on("disconnect", () => {
      console.log("❌ Socket desconectado:", socket.id);
    });
  });

  // 5. Levantar el servidor
  server.listen(app.get("port"), () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${app.get("port")}`);
  });
};

startServer();