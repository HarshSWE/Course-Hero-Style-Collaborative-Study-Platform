import React, { useState } from "react";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import MinimizeIcon from "@mui/icons-material/Minimize";
import AddIcon from "@mui/icons-material/Add";

interface ChatBotModalProps {
  content: string;
  onClose: () => void;
}

type Message = {
  role: "user" | "bot";
  content: string;
};

const ChatBotModal: React.FC<ChatBotModalProps> = ({ content, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Function to send user message and handle chatbot response
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/file/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          userMessage: input,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }
      // Add bot's response to chat history
      const botMessage: Message = {
        role: "bot",
        content: data.message,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content:
            "Sorry, there was an error processing your request. Please try again.",
        },
      ]);
      console.error("Chatbot error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 z-50 w-[150px] h-[40px] bg-blue-500 rounded-full shadow-lg flex items-center justify-center cursor-pointer space-x-2 px-4"
        onClick={() => setIsMinimized(false)}
        title="Expand Chatbot"
        role="button"
      >
        <SmartToyIcon className="text-white" />
        <AddIcon className="text-white" />
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[350px] h-[500px] bg-white rounded-xl shadow-lg flex flex-col overflow-hidden border">
      <div className="flex items-center justify-between p-3 border-b bg-blue-500 text-white">
        <div className="flex items-center space-x-2">
          <SmartToyIcon />
          <span className="font-semibold">Chat Assistant</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-white mb-[13px]"
            title="Minimize Chatbot"
          >
            <MinimizeIcon />
          </button>
        </div>
      </div>
      {/* Chat messages display area */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 rounded-lg text-sm max-w-[80%] ${
              msg.role === "user"
                ? "bg-blue-200 self-end ml-auto"
                : "bg-gray-200 self-start mr-auto"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {/* Loading indicator */}
        {isLoading && (
          <div className="text-gray-500 italic text-sm">AI is typing...</div>
        )}
      </div>
      {/* Input field and send button */}
      <div className="p-3 border-t flex">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded p-2 text-sm mr-2"
          placeholder="Ask something..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isLoading) handleSend();
          }}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-3 py-2 rounded text-sm"
          disabled={isLoading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBotModal;
