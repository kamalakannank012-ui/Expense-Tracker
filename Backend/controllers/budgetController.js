import Budget from "../models/Budget.js";

export const saveBudget = async (req, res) => {
  try {
    const { month, amount } = req.body;

    const budget = await Budget.findOne({
      user: req.user._id,
      month,
    });

    if (budget) {
      budget.amount = amount;

      await budget.save();

      return res.json(budget);
    }

    const newBudget = await Budget.create({
      user: req.user._id,
      month,
      amount,
    });

    res.json(newBudget);

  } catch (err) {
    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const getBudget = async (req, res) => {
  try {
    const month = req.params.month;

    const budget = await Budget.findOne({
      user: req.user._id,
      month,
    });

    res.json(budget);

  } catch (err) {
    res.status(500).json({
      message: "Server Error",
    });
  }
};