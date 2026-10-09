
import Groq from "groq-sdk";

// Initialize Groq using the key in Backend/.env
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// =========================
// AI Financial Advisor
// =========================
export const getAIAdvice = async (req, res) => {
  try {
    const { expenses } = req.body;

    // Validate input
    if (!Array.isArray(expenses)) {
      return res.status(400).json({
        message: "Expenses must be provided as an array.",
      });
    }

    // Calculate income and expenses safely
    const totalIncome = expenses
      .filter((e) => e.type === "Income")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const totalExpense = expenses
      .filter((e) => e.type === "Expense")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const savings = totalIncome - totalExpense;

    const prompt = `
You are a professional personal financial advisor.

Analyze the user's financial transactions and provide practical,
realistic suggestions. Do not claim to be a licensed human advisor.

Total Income: ₹${totalIncome}
Total Expenses: ₹${totalExpense}
Savings: ₹${savings}

Transactions:
${expenses
  .map(
    (e) =>
      `${e.title || "Untitled"} | ${e.category || "Other"} | ₹${Number(e.amount) || 0} | ${e.type || "Unknown"}`
  )
  .join("\n")}

Return ONLY valid JSON using exactly this structure:
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

Do not include Markdown fences or extra text.
All four fields are required. The last two fields must be arrays
containing three strings each.
`;

    const chat = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "You analyze personal finances and return valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: {
        type: "json_object",
      },
    });

    const content = chat.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Groq returned an empty AI response.");
    }

    const aiResponse = JSON.parse(content);

    // Validate the response expected by the frontend
    if (
      typeof aiResponse.spendingAnalysis !== "string" ||
      typeof aiResponse.savingAnalysis !== "string" ||
      !Array.isArray(aiResponse.budgetSuggestions) ||
      !Array.isArray(aiResponse.tips)
    ) {
      throw new Error("Groq returned an unexpected advice format.");
    }

    return res.json({
      advice: aiResponse,
    });
  } catch (error) {
    console.error("AI Financial Advisor Error:", error.message);

    if (error.status === 401) {
      return res.status(401).json({
        message:
          "Groq API key is invalid. Check GROQ_API_KEY in Backend/.env.",
      });
    }

    return res.status(error.status || 500).json({
      message: "Failed to generate AI financial advice.",
      error: error.message,
    });
  }
};

// =========================
// AI Expense Categorizer
// =========================
export const categorizeExpense = async (req, res) => {
  try {
    const { title } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        message: "Please provide an expense title.",
      });
    }

    const prompt = `
Choose exactly ONE category from this list:

Food
Travel
Shopping
Salary
Bills
Entertainment
Health
Education
Other

Expense title: "${title.trim()}"

Return only the category name.
`;

    const chat = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
    });

    const category = chat.choices?.[0]?.message?.content?.trim();

    const allowedCategories = [
      "Food",
      "Travel",
      "Shopping",
      "Salary",
      "Bills",
      "Entertainment",
      "Health",
      "Education",
      "Other",
    ];

    if (!category || !allowedCategories.includes(category)) {
      return res.status(502).json({
        message: "AI returned an invalid expense category.",
      });
    }

    return res.json({ category });
  } catch (error) {
    console.error("Expense Categorization Error:", error.message);

    if (error.status === 401) {
      return res.status(401).json({
        message:
          "Groq API key is invalid. Check GROQ_API_KEY in Backend/.env.",
      });
    }

    return res.status(error.status || 500).json({
      message: "Failed to categorize expense.",
      error: error.message,
    });
  }
};