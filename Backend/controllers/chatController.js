import Chat from "../models/Chat.js";
import Expense from "../models/Expense.js";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Send message to AI
export const sendChatMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Please enter a message",
      });
    }

    // Get user's expense data from MongoDB
    const expenses = await Expense.find({
      user: req.user._id,
    }).sort({ date: -1 });

    // Prepare expense data for AI
    const expenseData = expenses.map((item) => ({
      title: item.title,
      amount: item.amount,
      category: item.category,
      type: item.type,
      date: item.date,
    }));

    // Calculate current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthExpenses = expenses.filter((item) => {
      const date = new Date(item.date);

      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    });

    const currentMonthIncome = currentMonthExpenses
      .filter((item) => item.type === "Income")
      .reduce((total, item) => total + Number(item.amount), 0);

    const currentMonthExpense = currentMonthExpenses
      .filter((item) => item.type === "Expense")
      .reduce((total, item) => total + Number(item.amount), 0);

    const currentMonthBalance =
      currentMonthIncome - currentMonthExpense;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
You are an AI financial assistant inside an Expense Tracker application.

You have access to the user's real financial data from MongoDB.

Answer the user's question using ONLY the financial data provided below.

IMPORTANT RULES:

- Give a short answer.
- Give 1 or 2 sentences maximum unless the user asks for details.
- Do not repeat the user's question.
- Do not invent financial data.
- If the requested information is not available, clearly say so.
- Use ₹ for money amounts.
- When the user asks about "monthly expense", use the CURRENT MONTH data.
- When the user asks about "monthly income", use the CURRENT MONTH income.
- When the user asks about savings/balance, calculate income minus expenses.
- When the user asks about past data, use the historical transactions provided.
- When the user asks about a specific category, calculate using the category data.
- Keep the answer simple and direct.

CURRENT MONTH SUMMARY:
Income: ₹${currentMonthIncome}
Expense: ₹${currentMonthExpense}
Balance: ₹${currentMonthBalance}

ALL USER TRANSACTIONS:
${JSON.stringify(expenseData)}
`,
        },
        {
          role: "user",
          content: message,
        },
      ],
    model: "openai/gpt-oss-20b",

      temperature: 0.2,

      max_tokens: 150,
    });

    const reply =
      completion.choices[0]?.message?.content ||
      "Sorry, I could not generate a reply.";

    // Save conversation
    const chat = await Chat.create({
      user: req.user._id,
      message,
      reply,
    });

    res.status(200).json({
      reply: chat.reply,
      chatId: chat._id,
    });
  } catch (error) {
    console.log("Chat Error:", error);

    res.status(500).json({
      message: error.message || "AI Chat Error",
    });
  }
};


// Get previous chat history
export const getChatHistory = async (req, res) => {
  try {
    const chats = await Chat.find({
      user: req.user._id,
    }).sort({ createdAt: 1 });

    res.status(200).json(chats);
  } catch (error) {
    console.log("Chat History Error:", error);

    res.status(500).json({
      message: "Unable to load chat history",
    });
  }
};


// Clear chat history
export const clearChatHistory = async (req, res) => {
  try {
    await Chat.deleteMany({
      user: req.user._id,
    });

    res.status(200).json({
      message: "Chat history cleared",
    });
  } catch (error) {
    console.log("Clear Chat Error:", error);

    res.status(500).json({
      message: "Unable to clear chat history",
    });
  }
};