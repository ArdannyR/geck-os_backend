import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

// Función auxiliar para obtener el ID del usuario de forma segura
const getUserId = (req) => {
    const id = req.user?.id || req.user?._id || req.user?.uid;
    return id ? id.toString() : null;
};

export const accessChat = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { userId: otherUserId } = req.body;

        if (!userId) {
            return res.status(401).json({ ok: false, msg: "No se encontró el ID del usuario autenticado" });
        }

        if (!otherUserId) {
            return res.status(400).json({ ok: false, msg: "El userId del destinatario es requerido en el body" });
        }

        let chat = await Chat.findOne({
            isGroup: false,
            participants: { $all: [userId, otherUserId], $size: 2 }
        }).populate("participants", "name email");

        if (!chat) {
            chat = await Chat.create({
                isGroup: false,
                participants: [userId, otherUserId]
            });
            chat = await chat.populate("participants", "name email");
        }

        return res.status(200).json({ ok: true, chat });
    } catch (error) {
        console.error("❌ Error en accessChat:", error);
        return res.status(500).json({ ok: false, msg: "Error al acceder al chat" });
    }
};

export const createGroupChat = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ ok: false, msg: "Usuario no autenticado" });

        const { users, name } = req.body;

        if (!users || !Array.isArray(users) || users.length < 2) {
            return res.status(400).json({ ok: false, msg: "Se requieren al menos 2 usuarios extra para un grupo" });
        }
        if (!name) {
            return res.status(400).json({ ok: false, msg: "El nombre del grupo es requerido" });
        }

        const participants = [...users, userId];

        const chat = await Chat.create({
            isGroup: true,
            participants,
            admins: [userId],
            groupName: name
        });

        const populatedChat = await chat.populate("participants", "name email");
        return res.status(201).json({ ok: true, chat: populatedChat });
    } catch (error) {
        console.error("❌ Error en createGroupChat:", error);
        return res.status(500).json({ ok: false, msg: "Error al crear el grupo" });
    }
};

export const fetchChats = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ ok: false, msg: "Usuario no autenticado" });

        const chats = await Chat.find({
            participants: userId
        })
        .populate("participants", "name email")
        .populate("admins", "name email")
        .populate("lastMessage")
        .populate("workspaceId", "name")
        .sort({ updatedAt: -1 });

        return res.status(200).json({ ok: true, chats });
    } catch (error) {
        console.error("❌ Error en fetchChats:", error);
        return res.status(500).json({ ok: false, msg: "Error al obtener los chats" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const senderId = getUserId(req);
        if (!senderId) return res.status(401).json({ ok: false, msg: "Usuario no autenticado" });

        const { chatId, content, clientTimestamp } = req.body;

        if (!chatId || !content) {
            return res.status(400).json({ ok: false, msg: "chatId y content son requeridos" });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ ok: false, msg: "Chat no encontrado" });
        }

        // Convertimos todos los IDs a string para comparar con seguridad
        const participantIds = chat.participants.map(p => p.toString());
        if (!participantIds.includes(senderId)) {
            return res.status(403).json({ ok: false, msg: "No eres participante de este chat" });
        }

        const messageData = {
            chatId,
            senderId,
            content,
            ...(clientTimestamp && { createdAt: new Date(clientTimestamp) })
        };

        const message = await Message.create(messageData);
        
        // Al actualizar el lastMessage, se actualiza automáticamente el updatedAt del Chat
        await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

        const populatedMessage = await message.populate("senderId", "name email");

        return res.status(201).json({ ok: true, message: populatedMessage });
    } catch (error) {
        console.error("❌ Error en sendMessage:", error);
        return res.status(500).json({ ok: false, msg: "Error al enviar mensaje" });
    }
};

export const fetchMessages = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ ok: false, msg: "Usuario no autenticado" });

        const { chatId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ ok: false, msg: "Chat no encontrado" });
        }

        const participantIds = chat.participants.map(p => p.toString());
        if (!participantIds.includes(userId)) {
            return res.status(403).json({ ok: false, msg: "No eres participante de este chat" });
        }

        const messages = await Message.find({
            chatId,
            deletedFor: { $ne: userId }
        })
        .populate("senderId", "name email")
        .sort({ createdAt: -1 }) // Los más recientes primero
        .skip(skip)
        .limit(limit);

        const total = await Message.countDocuments({
            chatId,
            deletedFor: { $ne: userId }
        });

        return res.status(200).json({
            ok: true,
            messages,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("❌ Error en fetchMessages:", error);
        return res.status(500).json({ ok: false, msg: "Error al obtener mensajes" });
    }
};

export const editMessage = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ ok: false, msg: "Usuario no autenticado" });

        const { messageId } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ ok: false, msg: "content es requerido" });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ ok: false, msg: "Mensaje no encontrado" });
        }

        if (message.senderId.toString() !== userId) {
            return res.status(403).json({ ok: false, msg: "No puedes editar este mensaje" });
        }

        message.content = content;
        message.isEdited = true;
        await message.save();

        const populatedMessage = await message.populate("senderId", "name email");
        return res.status(200).json({ ok: true, message: populatedMessage });
    } catch (error) {
        console.error("❌ Error en editMessage:", error);
        return res.status(500).json({ ok: false, msg: "Error al editar mensaje" });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ ok: false, msg: "Usuario no autenticado" });

        const { messageId } = req.params;
        const { type } = req.body;

        if (!type || !['for_me', 'for_all'].includes(type)) {
            return res.status(400).json({ ok: false, msg: "type debe ser 'for_me' o 'for_all'" });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ ok: false, msg: "Mensaje no encontrado" });
        }

        if (type === 'for_me') {
            const deletedForStrs = message.deletedFor.map(id => id.toString());
            if (!deletedForStrs.includes(userId)) {
                message.deletedFor.push(userId);
                await message.save();
            }
        } else {
            if (message.senderId.toString() !== userId) {
                return res.status(403).json({ ok: false, msg: "No puedes eliminar este mensaje para todos" });
            }
            message.content = "Mensaje eliminado";
            message.isDeleted = true;
            await message.save();
        }

        return res.status(200).json({ ok: true, msg: "Mensaje eliminado correctamente" });
    } catch (error) {
        console.error("❌ Error en deleteMessage:", error);
        return res.status(500).json({ ok: false, msg: "Error al eliminar mensaje" });
    }
};