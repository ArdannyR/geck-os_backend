import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            required: true
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        content: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['sent', 'delivered', 'read'],
            default: 'sent'
        },
        isEdited: {
            type: Boolean,
            default: false
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedFor: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }]
    },
    { timestamps: true }
);

messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model("Message", messageSchema);
