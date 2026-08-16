import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { chatWithAI } from "../controllers/aiChatController.js";

const router = express.Router();

// AI Chat
router.post("/", protect, chatWithAI);

export default router;