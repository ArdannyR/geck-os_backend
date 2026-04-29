import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.js";
import {
    accessChat,
    createGroupChat,
    fetchChats,
    sendMessage,
    fetchMessages,
    editMessage,
    deleteMessage
} from "../controllers/chat_controller.js";

const router = Router();
router.use(verifyAuth);

router.post("/access", accessChat); // probado 
router.post("/group", createGroupChat); 
router.get("/chat", fetchChats); // probado no se como se llama esto y porque tengo 2 fetchChats?
router.post("/message", sendMessage); // probado 
router.put("/message/:messageId", editMessage); // probado
router.delete("/message/:messageId", deleteMessage); // probado
router.get("/:chatId/chat", fetchMessages); // probado no se como se llama esto

export default router;
