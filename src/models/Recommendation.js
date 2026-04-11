import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        noteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: false
        },
        title: {
            type: String,
            required: true
        },
        text: {
            type: String,
            required: true
        },
        type: {
            type: String,
            default: "general"
        },
        status: {
            type: String,
            enum: ["new", "read"],
            default: "new"
        }
    },
    { timestamps: true }
);

export default mongoose.model("Recommendation", recommendationSchema);