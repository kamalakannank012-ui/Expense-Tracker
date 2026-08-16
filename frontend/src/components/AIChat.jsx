import { useEffect, useState } from "react";
import API from "../services/api";

function AIChat() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load previous chats from MongoDB when page opens / F5
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const res = await API.get("/chat");

        const history = [];

        res.data.forEach((chat) => {
          history.push({
            role: "user",
            text: chat.message,
          });

          history.push({
            role: "ai",
            text: chat.reply,
          });
        });

        setChatHistory(history);
      } catch (error) {
        console.log("Chat History Error:", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, []);

  // Send message
  const sendMessage = async () => {
    if (!message.trim()) {
      alert("Please enter a message.");
      return;
    }

    const userMessage = message.trim();

    try {
      setLoading(true);

      // Show user's message immediately
      setChatHistory((prev) => [
        ...prev,
        {
          role: "user",
          text: userMessage,
        },
      ]);

      setMessage("");

      // Send message to backend
      const res = await API.post("/chat", {
        message: userMessage,
      });

      // Show AI reply
      setChatHistory((prev) => [
        ...prev,
        {
          role: "ai",
          text: res.data.reply,
        },
      ]);
    } catch (err) {
      console.log(err);

      setChatHistory((prev) => [
        ...prev,
        {
          role: "ai",
          text: err.response?.data?.message || "AI Error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Clear chat from MongoDB
  const clearChat = async () => {
    try {
      await API.delete("/chat");

      setChatHistory([]);

      alert("Chat history cleared.");
    } catch (error) {
      console.log("Clear Chat Error:", error);
      alert(
        error.response?.data?.message || "Unable to clear chat history"
      );
    }
  };

  return (
    <div className="card">

      {/* Header */}
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h4 className="mb-0">🤖 AI Financial Assistant</h4>

        {chatHistory.length > 0 && (
          <button
            className="btn btn-light btn-sm"
            onClick={clearChat}
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Body */}
      <div className="card-body">

        {/* Chat History */}
        <div
          className="mb-3"
          style={{
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >

          {loadingHistory ? (
            <div className="text-muted text-center p-3">
              Loading previous chats...
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="text-muted text-center p-3">
              Ask me anything about your expenses...
            </div>
          ) : (
            chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`mb-3 d-flex ${
                  chat.role === "user"
                    ? "justify-content-end"
                    : "justify-content-start"
                }`}
              >
                <div
                  className={
                    chat.role === "user"
                      ? "bg-primary text-white p-2 rounded"
                      : "bg-light border p-2 rounded"
                  }
                  style={{
                    maxWidth: "75%",
                  }}
                >
                  <strong>
                    {chat.role === "user" ? "You" : "🤖 AI"}
                  </strong>

                  <div className="mt-1">
                    {chat.text}
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="text-muted">
              🤖 AI is thinking...
            </div>
          )}
        </div>

        {/* Message Input */}
        <textarea
          className="form-control"
          rows="3"
          placeholder="Ask anything about your expenses..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
        />

        {/* Ask AI */}
        <button
          className="btn btn-success mt-3"
          onClick={sendMessage}
          disabled={loading}
        >
          {loading ? "Thinking..." : "Ask AI"}
        </button>

      </div>
    </div>
  );
}

export default AIChat;