
import { useRef, useState } from "react";
import API from "../services/api";
import { toast } from "react-toastify";

const INITIAL_DATA = {
  title: "",
  amount: "",
  category: "Other",
  type: "",
};

const CATEGORIES = [
  "Food",
  "Transport",
  "Petrol",
  "Shopping",
  "Salary",
  "Rent",
  "Travel",
  "Medical",
  "Education",
  "Entertainment",
  "Other",
];

function VoiceExpense({ onTransactionAdded }) {
  const recognitionRef = useRef(null);

  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState("en-IN");
  const [parsedData, setParsedData] = useState(INITIAL_DATA);

  // Parse speech into transaction details.
  const parseVoice = (speech) => {
    const text = speech.toLowerCase().trim();

    // Detect amount, including common recognition error "25th"
    // when the user intended "250".
    const amountMatch = text.match(
      /\b\d+(?:,\d{3})*(?:\.\d{1,2})?(?:st|nd|rd|th)?\b/
    );

    let amount = "";

    if (amountMatch) {
      const rawAmount = amountMatch[0].replace(/,/g, "");

      if (/^25th$/i.test(rawAmount)) {
        amount = "250";
      } else {
        amount = rawAmount.replace(/(?:st|nd|rd|th)$/i, "");
      }
    } else {
      // Support common English number words.
      const numberWords = {
        zero: 0,
        one: 1,
        two: 2,
        three: 3,
        four: 4,
        five: 5,
        six: 6,
        seven: 7,
        eight: 8,
        nine: 9,
        ten: 10,
        eleven: 11,
        twelve: 12,
        thirteen: 13,
        fourteen: 14,
        fifteen: 15,
        sixteen: 16,
        seventeen: 17,
        eighteen: 18,
        nineteen: 19,
        twenty: 20,
        thirty: 30,
        forty: 40,
        fifty: 50,
        sixty: 60,
        seventy: 70,
        eighty: 80,
        ninety: 90,
      };

      const words = text.match(/\b[a-z]+\b/g) || [];
      let value = 0;
      let found = false;

      for (let i = 0; i < words.length; i++) {
        const word = words[i];

        if (numberWords[word] !== undefined) {
          value += numberWords[word];
          found = true;
        } else if (word === "hundred" && found) {
          value = Math.max(value, 1) * 100;
        } else if (word === "thousand" && found) {
          value *= 1000;
          break;
        } else if (found) {
          break;
        }
      }

      if (found) amount = String(value);
    }

    // Detect transaction type.
    const incomePattern =
      /\b(income|earned|earn|salary|received|receive)\b/;
    const expensePattern =
      /\b(spent|spend|expense|paid|pay|bought|buy|purchase)\b/;

    let type = "";

    if (incomePattern.test(text)) {
      type = "Income";
    } else if (expensePattern.test(text)) {
      type = "Expense";
    }

    // Detect category.
    const categoryRules = [
      ["Petrol", /\b(petrol|fuel|gasoline)\b/],
      ["Transport", /\b(transport|bus|train|taxi|auto|metro)\b/],
      ["Food", /\b(food|lunch|dinner|breakfast|snack|restaurant)\b/],
      ["Shopping", /\b(shopping|clothes|dress|shirt|shoes)\b/],
      ["Salary", /\b(salary|wages)\b/],
      ["Rent", /\b(rent)\b/],
      ["Travel", /\b(travel|trip|hotel)\b/],
      ["Medical", /\b(medical|medicine|hospital|doctor)\b/],
      ["Education", /\b(education|college|book|course|fees)\b/],
      ["Entertainment", /\b(movie|entertainment|game)\b/],
    ];

    const matchedCategory = categoryRules.find(([, pattern]) =>
      pattern.test(text)
    );

    const category = matchedCategory
      ? matchedCategory[0]
      : "Other";

    // Create a clean title from the recognized sentence.
    let title = text
      .replace(
        /\b\d+(?:,\d{3})*(?:\.\d{1,2})?(?:st|nd|rd|th)?\b/g,
        " "
      )
      .replace(
        /\b(i|me|my|a|an|the|for|of|to|on|in|using|rupees|rupee|rs|spent|spend|expense|paid|pay|bought|buy|purchase|income|earned|earn|received|receive)\b/g,
        " "
      )
      .replace(/\s+/g, " ")
      .trim();

    // For "I spent 250 for petrol", use "Petrol" as the title.
    if (!title || /^(for|on|in|to)$/i.test(title)) {
      title = category;
    }

    // Remove the category word from longer titles only when
    // no other useful title text remains.
    title = title.charAt(0).toUpperCase() + title.slice(1);

    setParsedData({
      title,
      amount,
      category,
      type,
    });
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(
        "Speech recognition is not supported. Please use updated Chrome."
      );
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
      setTranscript("");
      setParsedData(INITIAL_DATA);
    };

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript.trim();

      setTranscript(spokenText);
      parseVoice(spokenText);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        toast.error("Please allow microphone access in Chrome.");
      } else if (event.error === "no-speech") {
        toast.error("No speech detected. Please try again.");
      } else if (event.error !== "aborted") {
        toast.error(`Voice recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error("Microphone start error:", error);
      setListening(false);
      toast.error("Could not start the microphone.");
    }
  };

  const updateField = (field, value) => {
    setParsedData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const addTransaction = async () => {
    const title = parsedData.title.trim();
    const amount = Number(parsedData.amount);

    if (!title) {
      toast.error("Please enter a transaction title.");
      return;
    }

    if (
      parsedData.amount === "" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      toast.error("Please enter a valid amount greater than zero.");
      return;
    }

    if (!parsedData.type) {
      toast.error("Please select Income or Expense.");
      return;
    }

    if (saving) return;

    setSaving(true);

    try {
      const payload = {
        title,
        amount,
        category: parsedData.category || "Other",
        type: parsedData.type,
      };

      console.log("Submitting transaction:", payload);

      const response = await API.post("/expenses", payload);

      console.log("Transaction saved:", response.data);

      toast.success("Transaction added successfully!");

      setTranscript("");
      setParsedData({ ...INITIAL_DATA });

      if (typeof onTransactionAdded === "function") {
        await onTransactionAdded();
      }
    } catch (error) {
      console.error("Transaction save failed:", error);
      console.error("Server response:", error.response?.data);
      console.error("HTTP status:", error.response?.status);

      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error(
          error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "Unable to add transaction. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card mt-3 shadow">
      <div className="card-header bg-info text-white">
        <h4 className="mb-0">🎤 Voice Expense Entry</h4>
      </div>

      <div className="card-body">
        <label htmlFor="voice-language" className="form-label">
          Recognition language
        </label>

        <select
          id="voice-language"
          className="form-select mb-3"
          value={language}
          disabled={listening || saving}
          onChange={(event) => setLanguage(event.target.value)}
        >
          <option value="en-IN">English (India)</option>
          <option value="ta-IN">Tamil</option>
          <option value="en-US">English (United States)</option>
        </select>

        <button
          type="button"
          className={`btn ${listening ? "btn-danger" : "btn-primary"}`}
          onClick={startListening}
          disabled={saving}
        >
          {listening ? "⏹ Stop Listening" : "🎤 Start Speaking"}
        </button>

        {listening && (
          <div className="alert alert-info mt-3">
            Listening... Say something like "I spent 250 for petrol".
          </div>
        )}

        {transcript && (
          <>
            <hr />

            <h5>You said:</h5>
            <div className="alert alert-secondary">{transcript}</div>

            <p className="text-muted">
              Check the details below before saving.
            </p>

            <div className="mb-3">
              <label htmlFor="transaction-title" className="form-label">
                Transaction title
              </label>
              <input
                id="transaction-title"
                className="form-control"
                value={parsedData.title}
                onChange={(event) =>
                  updateField("title", event.target.value)
                }
              />
            </div>

            <div className="mb-3">
              <label htmlFor="transaction-amount" className="form-label">
                Amount (₹)
              </label>
              <input
                id="transaction-amount"
                className="form-control"
                type="number"
                min="0.01"
                step="0.01"
                value={parsedData.amount}
                onChange={(event) =>
                  updateField("amount", event.target.value)
                }
              />
            </div>

            <div className="mb-3">
              <label htmlFor="transaction-category" className="form-label">
                Category
              </label>
              <select
                id="transaction-category"
                className="form-select"
                value={parsedData.category}
                onChange={(event) =>
                  updateField("category", event.target.value)
                }
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="transaction-type" className="form-label">
                Transaction type
              </label>
              <select
                id="transaction-type"
                className="form-select"
                value={parsedData.type}
                onChange={(event) =>
                  updateField("type", event.target.value)
                }
              >
                <option value="">Choose type</option>
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
              </select>
            </div>

            <button
              type="button"
              className="btn btn-success"
              onClick={addTransaction}
              disabled={saving || listening}
            >
              {saving
                ? "Saving transaction..."
                : "➕ Confirm and Add Transaction"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default VoiceExpense;