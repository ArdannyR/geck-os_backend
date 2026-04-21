import { Router } from "express";
import { registerUser, loginUser, confirmEmail, forgotPassword, verifyPasswordToken, resetPassword, googleLogin } from "../controllers/auth_controller.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/confirm/:token", confirmEmail);
router.post("/forgot-password", forgotPassword);
router.get("/forgot-password/:token", verifyPasswordToken);
router.post("/reset-password/:token", resetPassword);
router.post("/google", googleLogin);

export default router;