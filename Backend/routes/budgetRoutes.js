import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  saveBudget,
  getBudget,
} from "../controllers/budgetController.js";

const router = express.Router();

router.post("/", protect, saveBudget);

router.get("/:month", protect, getBudget);

export default router;