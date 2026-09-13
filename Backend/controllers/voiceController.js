import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const processVoiceExpense = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Voice text is required",
      });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
You are an expense tracker voice assistant.

Convert the user's spoken sentence into transaction data.

Return ONLY valid JSON.

Required format:
{
  "title": "",
  "amount": 0,
  "category": "",
  "type": "Expense"
}

Rules:
- amount must be a number.
- type must be either "Expense" or "Income".
- Food, Travel, Shopping, Bills, Entertainment and similar purchases are Expense.
- Salary, wages, bonus and money received are Income.
- Use a simple suitable category.
- Do not include explanations.
          `,
        },
        {
          role: "user",
          content: text,
        },
      ],
      model: "openai/gpt-oss-20b",
      temperature: 0,
      max_tokens: 150,
    });

    const reply = completion.choices[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        message: "AI could not process the voice input",
      });
    }

    const cleanedReply = reply
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const transaction = JSON.parse(cleanedReply);

    res.status(200).json(transaction);

  } catch (error) {
    console.log("Voice AI Error:", error);

    res.status(500).json({
      message: error.message || "Voice processing failed",
    });
  }
};