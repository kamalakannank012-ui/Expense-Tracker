import { useState } from "react";
import API from "../services/api";
import { toast } from "react-toastify";

function VoiceExpense({ onTransactionAdded }) {
  const [transcript, setTranscript] = useState("");

  const [parsedData, setParsedData] = useState({
    title: "",
    amount: "",
    category: "",
    type: "",
  });

  // ---------------------------
  // Start Voice Recognition
  // ---------------------------
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;

      setTranscript(text);

      parseVoice(text);
    };

    recognition.onerror = () => {
      toast.error("Voice recognition failed");
    };
  };

  // ---------------------------
  // Parse Spoken Text
  // ---------------------------
  const parseVoice = (text) => {
    const lower = text.toLowerCase();

    let type = "";

    if (
      lower.includes("spend") ||
      lower.includes("spent") ||
      lower.includes("expense") ||
      lower.includes("paid") ||
      lower.includes("pay") ||
      lower.includes("bought")||
      lower.includes("buy")
    ) {
      type = "Expense";
    }

    if (
      lower.includes("income") ||
      lower.includes("earned") ||
      lower.includes("earn") ||
      lower.includes("salary") ||
      lower.includes("received") ||
      lower.includes("receive")
    ) {
      type = "Income";
    }

    // Amount
    const amountMatch = lower.match(/\d+/);

    const amount = amountMatch ? amountMatch[0] : "";

    // Categories
    const categories = [
      "food",
  "transport",
  "petrol",
  "fuel",
  "shopping",
  "salary",
  "rent",
  "travel",
  "medical",
  "education",
  "entertainment",
  "other",
    ];

    let category = "Other";

    categories.forEach((item) => {
      if (lower.includes(item)) {
        category =
          item.charAt(0).toUpperCase() +
          item.slice(1);
      }
    });

    // Remove keywords to create title
    let title = text;

    title = title.replace(/\d+/g, "");

    title = title.replace(
      /spent|expense|paid|bought|income|earned|salary|received/gi,
      ""
    );

    title = title.trim();

    setParsedData({
      title,
      amount,
      category,
      type,
    });
  };

  // ---------------------------
  // Save Transaction
  // ---------------------------
  const addTransaction = async () => {
    try {
      if (
        !parsedData.title ||
        !parsedData.amount ||
        !parsedData.type
      ) {
        toast.error("Unable to detect transaction.");
        return;
      }

      await API.post("/expenses", {
        title: parsedData.title,
        amount: Number(parsedData.amount),
        category: parsedData.category,
        type: parsedData.type,
      });

      toast.success("Transaction Added Successfully");

      setTranscript("");

      setParsedData({
        title: "",
        amount: "",
        category: "",
        type: "",
      });

      if (onTransactionAdded) {
        onTransactionAdded();
      }

    } catch (err) {
      console.log(err);

      toast.error(
        err.response?.data?.message ||
        "Unable to add transaction"
      );
    }
  };

  return (
    <div className="card mt-3 shadow">

      <div className="card-header bg-info text-white">
        <h4 className="mb-0">
          🎤 Voice Expense Entry
        </h4>
      </div>

      <div className="card-body">

        <button
          className="btn btn-primary"
          onClick={startListening}
        >
          🎤 Start Speaking
        </button>

        {transcript && (
          <>
            <hr />

            <h6>You Said:</h6>

            <div className="alert alert-secondary">
              {transcript}
            </div>

            <table className="table">

              <tbody>

                <tr>
                  <th>Title</th>
                  <td>{parsedData.title}</td>
                </tr>

                <tr>
                  <th>Amount</th>
                  <td>{parsedData.amount}</td>
                </tr>

                <tr>
                  <th>Category</th>
                  <td>{parsedData.category}</td>
                </tr>

                <tr>
                  <th>Type</th>
                  <td>{parsedData.type}</td>
                </tr>

              </tbody>

            </table>

            <button
              className="btn btn-success"
              onClick={addTransaction}
            >
              ➕ Add Transaction
            </button>
          </>
        )}

      </div>

    </div>
  );
}

export default VoiceExpense;