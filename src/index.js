import app from "./app.js";
import connection from "./database.js";
import http from "http";
import rateLimit from "express-rate-limit";
import Message from "./models/Message.js";
import Chat from "./models/Chat.js";
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

        socket.on("setup", (userId) => {
            socket.join(userId);
            socket.emit("setup_complete", { userId });
            console.log(`👤 Usuario ${userId} configurado`);
        });

        socket.on("join_chat", (chatId) => {
            socket.join(chatId);
            console.log(`💬 Usuario unido al chat: ${chatId}`);
        });

        socket.on("new_message", async (data) => {
            try {
                const { chatId, senderId, content, clientTimestamp } = data;

                const chat = await Chat.findById(chatId);
                if (!chat) return;

                const messageData = {
                    chatId,
                    senderId,
                    content,
                    ...(clientTimestamp && { createdAt: new Date(clientTimestamp) })
                };

                const message = await Message.create(messageData);
                await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

                const populatedMessage = await message.populate("senderId", "name email");

                chat.participants.forEach(participantId => {
                    if (participantId.toString() !== senderId) {
                        socket.to(participantId.toString()).emit("message_received", populatedMessage);
                    }
                });

                socket.emit("message_sent", populatedMessage);

            } catch (error) {
                console.error("❌ Error en new_message:", error);
            }
        });

        socket.on("edit_message", async (data) => {
            try {
                const { messageId, senderId, content } = data;

                const message = await Message.findById(messageId);
                if (!message || message.senderId.toString() !== senderId) return;

                message.content = content;
                message.isEdited = true;
                await message.save();

                const populatedMessage = await message.populate("senderId", "name email");

                const chat = await Chat.findById(message.chatId);
                chat.participants.forEach(participantId => {
                    socket.to(participantId.toString()).emit("message_edited", populatedMessage);
                });
            } catch (error) {
                console.error("❌ Error en edit_message:", error);
            }
        });

        socket.on("delete_message", async (data) => {
            try {
                const { messageId, userId, type } = data;

                const message = await Message.findById(messageId);
                if (!message) return;

                if (type === 'for_me') {
                    if (!message.deletedFor.includes(userId)) {
                        message.deletedFor.push(userId);
                        await message.save();
                    }
                    socket.emit("message_deleted_for_me", { messageId });
                } else {
                    if (message.senderId.toString() !== userId) return;
                    message.content = "Mensaje eliminado";
                    message.isDeleted = true;
                    await message.save();

                    const chat = await Chat.findById(message.chatId);
                    chat.participants.forEach(participantId => {
                        socket.to(participantId.toString()).emit("message_deleted_for_all", {
                            messageId,
                            content: "Mensaje eliminado"
                        });
                    });
                }
            } catch (error) {
                console.error("❌ Error en delete_message:", error);
            }
        });

        socket.on("disconnect", () => {
            console.log("❌ Socket desconectado:", socket.id);
        });
    });

    server.listen(app.get("port"), "0.0.0.0", () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${app.get("port")}`);
    });
};

startServer();
