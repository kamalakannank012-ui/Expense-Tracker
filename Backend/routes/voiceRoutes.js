import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { processVoiceExpense } from "../controllers/voiceController.js";

const router = express.Router();

router.post("/", protect, processVoiceExpense);

export default router;