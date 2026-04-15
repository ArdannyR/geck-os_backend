import { Router } from "express";
import { getProfile, updatePassword, updateProfile, updatePreferences, updateImage, deleteAccount, searchUsers } from "../controllers/user_controller.js";
import { verifyAuth } from "../middlewares/auth.js";

const router = Router();
router.use(verifyAuth);

router.get("/profile", getProfile);
router.put("/update-password", updatePassword);
router.patch("/preferences", updatePreferences);
router.post("/update-image", updateImage);
router.get("/search", searchUsers);
router.delete("/delete-account", deleteAccount);
router.put("/profile/:id", updateProfile);

export default router;