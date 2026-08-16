import Groq from "groq-sdk";

// =========================
// AI Financial Advisor
// =========================
export const getAIAdvice = async (req, res) => {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  try {
    const { expenses } = req.body;

    const totalIncome = expenses
      .filter((e) => e.type === "Income")
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpense = expenses
      .filter((e) => e.type === "Expense")
      .reduce((sum, e) => sum + e.amount, 0);

    const prompt = `
You are a professional financial advisor.

Analyze the user's expense data.

Income: ₹${totalIncome}
Expense: ₹${totalExpense}
Savings: ₹${totalIncome - totalExpense}

Transactions:

${expenses
  .map(
    (e) =>
      `${e.title} | ${e.category} | ₹${e.amount} | ${e.type}`
  )
  .join("\n")}

Return ONLY valid JSON.

Use this exact structure:

{
  "spendingAnalysis": "2-3 sentences",
  "savingAnalysis": "2-3 sentences",
  "budgetSuggestions": [
    "Suggestion 1",
    "Suggestion 2",
    "Suggestion 3"
  ],
  "tips": [
    "Tip 1",
    "Tip 2",
    "Tip 3"
  ]
}

Do not include markdown.
Do not include explanation.
Return only JSON.
`;

    const chat = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Remove markdown if AI returns it
    const content = chat.choices[0].message.content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const aiResponse = JSON.parse(content);

    res.json({
      advice: aiResponse,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// =========================
// AI Expense Categorizer
// =========================
export const categorizeExpense = async (req, res) => {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  try {
    const { title } = req.body;

    const prompt = `
You are an expense categorizer.

Choose ONLY ONE category from this list:

Food
Travel
Shopping
Salary
Bills
Entertainment
Health
Education
Other

Expense Title:
"${title}"

Return ONLY the category name.

Example:
Food
`;

    const chat = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    res.json({
      category: chat.choices[0].message.content.trim(),
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};