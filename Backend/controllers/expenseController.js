import Expense from "../models/Expense.js";

// Add Expense
export const addExpense = async (req, res) => {
  try {
    const { title, amount, category, type, date } = req.body;

    const expense = await Expense.create({
      user: req.user.id,
      title,
      amount,
      category,
      type,
      date,
    });

    res.status(201).json({
      message: "Expense Added Successfully",
      expense,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get All Expenses
export const getExpenses = async (req, res) => {
  try {
    const now = new Date();

const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

const expenses = await Expense.find({
  user: req.user.id,
  date: {
    $gte: firstDay,
    $lte: lastDay,
  },
}).sort({ date: -1 });

    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Update Expense
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        message: "Expense Not Found",
      });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      message: "Expense Updated Successfully",
      updatedExpense,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Delete Expense
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        message: "Expense Not Found",
      });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Expense Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};