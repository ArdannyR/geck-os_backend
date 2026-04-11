import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import fileUpload from "express-fileupload";
import passport from "passport";
import "./config/passport.js";

import authRoutes from "./routers/auth_routes.js";
import userRoutes from "./routers/user_routes.js";
import itemRoutes from "./routers/item_routes.js";
import aiRoutes from "./routers/ai_routes.js";
import workspaceRoutes from "./routers/workspace_routes.js";
import dashboardRoutes from "./routers/dashboard_routes.js";
import paymentRoutes from "./routers/payment_routes.js";
import executionRoutes from "./routers/execution_routes.js";

const app = express();
dotenv.config();

app.set("port", process.env.PORT || 3000);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(express.json());
app.use(cors());
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "./uploads"
}));
app.use(passport.initialize());

app.get("/", (req, res) => res.send("🚀 Server Deck-os on"));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/execute", executionRoutes);

app.use((req, res) => {
    console.log(`❌ 404 - Ruta no encontrada: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ msg: "Endpoint no encontrado - 404" });
});

export default app;