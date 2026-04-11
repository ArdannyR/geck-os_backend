import { Router } from "express";
import { getDesktop, createItem, uploadFileItem, getItemById, renameItem, moveItem, updateBulkPositions, updateTextContent, deleteItem, shareItem, getAllItems } from "../controllers/item_controller.js";
import { verifyAuth } from "../middlewares/auth.js";

const router = Router();
router.use(verifyAuth);

router.get("/desktop", getDesktop);
router.get("/all", getAllItems);
router.get("/:id", getItemById);
router.post("/", createItem);
router.post("/upload", uploadFileItem);
router.patch("/:id/rename", renameItem);
router.patch("/:id/move", moveItem);
router.patch("/positions/bulk", updateBulkPositions);
router.put("/files/:id", updateTextContent);
router.delete("/:id", deleteItem);
router.post("/share/:id", shareItem);

export default router;