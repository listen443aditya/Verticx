import React, { useState, useRef, useEffect } from "react";
import type { PrincipalDashboardData } from "../../types.ts";
import Card from "../ui/Card.tsx";
import Input from "../ui/Input.tsx";
import Button from "../ui/Button.tsx";
import { geminiService } from "../../services/geminiService.ts";
import { SparklesIcon, SendIcon, CopyIcon, PenToolIcon } from "lucide-react";
// FIX: Import useNavigate
import { useNavigate } from "react-router-dom";

interface AIAssistantCardProps {
  data: PrincipalDashboardData;
}

interface Message {
  sender: "user" | "ai";
  text: string;
  type?: "text" | "draft";
}

const SUGGESTED_PROMPTS = [
  "Draft a notice about school reopening.",
  "Summarize fee collection status.",
  "Write a congratulatory note for top students.",
  "Draft a warning letter for fee defaulters.",
];

const AIAssistantCard: React.FC<AIAssistantCardProps> = ({ data }) => {
  // FIX: Hook for navigation
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Hello! I'm your AI assistant. I can help analyze data or draft official announcements for you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const constructPrompt = (question: string) => {
    const {
      summary = {
        totalStudents: 0,
        totalTeachers: 0,
        feesCollected: 0,
        feesPending: 0,
      },
      classPerformance = [],
    } = data || {};

    return `
        You are a professional School Principal's Assistant.
        Context: School has ${
          summary.totalStudents
        } students. Fees Pending: ₹${(
      summary.feesPending || 0
    ).toLocaleString()}.
        
        User Request: "${question}"

        Instructions:
        1. If asked to write/draft something (letter, notice, email), use a formal tone.
        2. **CRITICAL:** If drafting, start with a subject line in this format: "Subject: [Your Subject Here]".
        3. Keep the body professional and clear.
        `;
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMessage: Message = { sender: "user", text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const prompt = constructPrompt(textToSend);
      const aiResponseText = await geminiService.generateResponse(prompt);

      // Detect if it's a draft (contains "Subject:" or "Dear")
      const isDraft =
        aiResponseText.includes("Subject:") || aiResponseText.includes("Dear");

      const aiMessage: Message = {
        sender: "ai",
        text: aiResponseText,
        type: isDraft ? "draft" : "text",
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "I'm having trouble connecting right now." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // --- FIX: Logic to navigate to Communication page with data ---
  const handleUseDraft = (text: string) => {
    navigate("/principal/communication", { state: { draftText: text } });
  };

  return (
    <Card className="flex flex-col h-[500px] relative overflow-hidden border-2 border-brand-primary/10">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-primary via-purple-500 to-pink-500"></div>

      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-purple-100 rounded-full text-purple-600">
          <SparklesIcon size={20} />
        </div>
        <h2 className="text-xl font-bold text-text-primary-dark">
          AI Insights
        </h2>
      </div>

      <div className="flex-grow overflow-y-auto mb-4 pr-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm relative group ${
                msg.sender === "user"
                  ? "bg-brand-primary text-white rounded-br-none"
                  : "bg-slate-50 border border-slate-100 text-text-primary-dark rounded-bl-none"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.text}
              </p>

              {msg.sender === "ai" && (
                <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(msg.text)}
                    className="p-1 hover:bg-slate-200 rounded text-xs text-slate-500 flex items-center gap-1"
                    title="Copy"
                  >
                    <CopyIcon size={12} /> Copy
                  </button>

                  {/* FIX: Call the navigation handler */}
                  {msg.type === "draft" && (
                    <button
                      className="p-1 hover:bg-purple-100 text-purple-600 rounded text-xs flex items-center gap-1 font-medium"
                      onClick={() => handleUseDraft(msg.text)}
                    >
                      <PenToolIcon size={12} /> Use Draft
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-50 rounded-2xl rounded-bl-none px-4 py-3 border border-slate-100">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-brand-secondary/50 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-brand-secondary/50 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-brand-secondary/50 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-none">
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="flex-shrink-0 text-xs bg-slate-100 hover:bg-brand-primary/10 hover:text-brand-primary text-slate-600 px-3 py-1.5 rounded-full transition-colors border border-slate-200"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="relative">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask AI or request a draft..."
          className="pr-12"
          disabled={isLoading}
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90 disabled:opacity-50 transition-colors"
        >
          <SendIcon size={16} />
        </button>
      </div>
    </Card>
  );
};

export default AIAssistantCard;
