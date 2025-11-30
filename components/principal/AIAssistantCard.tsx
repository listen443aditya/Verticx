import React, { useState, useRef, useEffect } from "react";
import type { PrincipalDashboardData } from "../../types.ts";
import Card from "../ui/Card.tsx";
import Input from "../ui/Input.tsx";
import Button from "../ui/Button.tsx";
import { geminiService } from "../../services/geminiService.ts";
import { SparklesIcon, SendIcon, CopyIcon, PenToolIcon } from "lucide-react"; // Assuming you have lucide-react or use your own icons

interface AIAssistantCardProps {
  data: PrincipalDashboardData;
}

interface Message {
  sender: "user" | "ai";
  text: string;
  type?: "text" | "draft"; // 'draft' implies it's a formal letter/notice
}

const SUGGESTED_PROMPTS = [
  "Summarize the school's financial health.",
  "Draft a notice about upcoming exams.",
  "Which class has the best performance?",
  "List students with low attendance.",
];

const AIAssistantCard: React.FC<AIAssistantCardProps> = ({ data }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Hello! I've analyzed your dashboard. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const constructPrompt = (question: string) => {
    // Safety check for data
    const {
      summary = {
        totalStudents: 0,
        totalTeachers: 0,
        feesCollected: 0,
        feesPending: 0,
      },
      classPerformance = [],
      teacherPerformance = [],
      collectionsByGrade = [],
    } = data || {};

    return `
        You are a smart consultant for a School Principal. 
        Strict Data Context:
        - Students: ${summary.totalStudents}, Teachers: ${summary.totalTeachers}
        - Financials: Collected ₹${(
          summary.feesCollected || 0
        ).toLocaleString()}, Pending ₹${(
      summary.feesPending || 0
    ).toLocaleString()}
        - Top Classes: ${classPerformance
          .slice(0, 3)
          .map((c) => `${c.name} (${c.performance.toFixed(0)}%)`)
          .join(", ")}
        - Top Teachers: ${teacherPerformance
          .slice(0, 3)
          .map((t) => t.teacherName)
          .join(", ")}
        - Fee Collections: ${collectionsByGrade
          .map((g) => `${g.name}: ₹${g.collected} collected`)
          .join(", ")}

        User Question: "${question}"

        Instructions:
        1. If asked to draft a notice/email, format it professionally.
        2. If asked for analysis, keep it brief and highlight anomalies.
        3. Be encouraging but factual.
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
      const isDraft =
        aiResponseText.includes("Subject:") ||
        aiResponseText.includes("Dear Parents");

      const aiMessage: Message = {
        sender: "ai",
        text: aiResponseText,
        type: isDraft ? "draft" : "text",
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I'm having trouble connecting to the AI brain right now.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
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
                <div className="flex justify-end gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(msg.text)}
                    className="p-1 hover:bg-slate-200 rounded text-xs text-slate-500 flex items-center gap-1"
                    title="Copy to Clipboard"
                  >
                    <CopyIcon size={12} /> Copy
                  </button>
                  {msg.type === "draft" && (
                    <button
                      className="p-1 hover:bg-purple-100 text-purple-600 rounded text-xs flex items-center gap-1 font-medium"
                      title="Use as Announcement"
                      onClick={() => {
                        alert(
                          "Feature Idea: This would open the 'Send Announcement' modal with this text pre-filled!"
                        );
                      }}
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
