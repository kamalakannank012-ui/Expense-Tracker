import "dotenv/config";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // Load .env FIRST

import connectDB from "./config/db.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import aiChatRoutes from "./routes/aiChatRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import voiceRoutes from "./routes/voiceRoutes.js";

console.log(process.env.GROQ_API_KEY);
console.log("Starting server...");

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/chat", aiChatRoutes);

app.get("/", (req, res) => {
  res.send("Expense Tracker Backend Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});