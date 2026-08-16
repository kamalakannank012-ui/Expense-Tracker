import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  sendChatMessage,
  getChatHistory,
  clearChatHistory,
} from "../controllers/chatController.js";

const router = express.Router();

// Send message
router.post("/", protect, sendChatMessage);

// Get previous chat history
router.get("/", protect, getChatHistory);

// Clear chat history
router.delete("/", protect, clearChatHistory);

export default router;