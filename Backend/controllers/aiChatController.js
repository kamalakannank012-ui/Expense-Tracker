import Groq from "groq-sdk";
import Expense from "../models/Expense.js";
export const chatWithAI = async (req, res) => {
  const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
  try {
    const { message } = req.body;

    // Get logged-in user's expenses
    const expenses = await Expense.find({
      user: req.user._id,
    });

    // Convert expenses into readable text
    const expenseData = expenses
      .map(
        (e) =>
          `Title: ${e.title},
Amount: ₹${e.amount},
Category: ${e.category},
Type: ${e.type},
Date: ${new Date(e.date).toLocaleDateString()}`
      )
      .join("\n");

    const prompt = `
You are a helpful AI Financial Assistant.

Here are the user's expenses:

${expenseData}

User Question:
${message}

Answer in simple English.
Give useful financial advice whenever possible.
`;

    const completion =
      await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

    res.json({
      reply: completion.choices[0].message.content,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "AI Server Error",
    });
  }
};