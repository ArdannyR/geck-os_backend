import Message from "../models/Message.js";

export const getChatHistory = async (req, res) => {
    try {
        const myId = req.user._id; 
        const { otherUserId } = req.params;

        const messages = await Message.find({
            $or: [
                { sender: myId, receiver: otherUserId },
                { sender: otherUserId, receiver: myId }
            ]
        }).sort({ createdAt: 1 }); 

        return res.status(200).json({ ok: true, messages });
    } catch (error) {
        console.error("❌ Error en getChatHistory:", error);
        return res.status(500).json({ ok: false, msg: "Error al obtener el historial de chat" });
    }
};