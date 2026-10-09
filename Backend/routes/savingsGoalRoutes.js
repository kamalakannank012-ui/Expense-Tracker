
import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  getSavingsGoals,
  createSavingsGoal,
  addSavingsToGoal,
  deleteSavingsGoal,
} from "../controllers/savingsGoalController.js";

const router = express.Router();

router.get("/", protect, getSavingsGoals);
router.post("/", protect, createSavingsGoal);
router.patch("/:id/saved", protect, addSavingsToGoal);
router.delete("/:id", protect, deleteSavingsGoal);

export default router;