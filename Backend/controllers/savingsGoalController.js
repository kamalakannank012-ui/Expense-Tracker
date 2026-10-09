
import SavingsGoal from "../models/SavingsGoal.js";

export const getSavingsGoals = async (req, res) => {
  try {
    const goals = await SavingsGoal.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json(goals);
  } catch (error) {
    console.error("Get savings goals error:", error.message);
    return res.status(500).json({
      message: "Unable to load savings goals.",
    });
  }
};

export const createSavingsGoal = async (req, res) => {
  try {
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : "";
    const target = Number(req.body.target);

    if (
      !name ||
      name.length > 60 ||
      !Number.isFinite(target) ||
      target < 1
    ) {
      return res.status(400).json({
        message: "Enter a goal name and a valid target amount.",
      });
    }

    const goal = await SavingsGoal.create({
      user: req.user._id,
      name,
      target,
      saved: 0,
    });

    return res.status(201).json(goal);
  } catch (error) {
    console.error("Create savings goal error:", error.message);
    return res.status(500).json({
      message: "Unable to create savings goal.",
    });
  }
};

export const addSavingsToGoal = async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Enter a valid savings amount.",
      });
    }

    const goal = await SavingsGoal.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        message: "Savings goal not found.",
      });
    }

    goal.saved = Math.min(goal.target, goal.saved + amount);
    await goal.save();

    return res.status(200).json(goal);
  } catch (error) {
    console.error("Update savings goal error:", error.message);
    return res.status(500).json({
      message: "Unable to update savings goal.",
    });
  }
};

export const deleteSavingsGoal = async (req, res) => {
  try {
    const goal = await SavingsGoal.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        message: "Savings goal not found.",
      });
    }

    return res.status(200).json({
      message: "Savings goal deleted successfully.",
    });
  } catch (error) {
    console.error("Delete savings goal error:", error.message);
    return res.status(500).json({
      message: "Unable to delete savings goal.",
    });
  }
};