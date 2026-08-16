import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  getAIAdvice,
  categorizeExpense,
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/advice", protect, getAIAdvice);
router.post("/categorize", protect, categorizeExpense);

export default router;