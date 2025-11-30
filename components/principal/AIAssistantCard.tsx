import React, { useState, useRef, useEffect } from "react";
import type { PrincipalDashboardData } from "../../types.ts";
import Card from "../ui/Card.tsx";
import Input from "../ui/Input.tsx";
import { geminiService } from "../../services/geminiService.ts";
import { SparklesIcon, SendIcon, CopyIcon, PenToolIcon } from "lucide-react";
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
  "Who is the best teacher?",
  "Draft a notice about exams.",
  "Analyze fee collection.",
  "Which class needs attention?",
];

const AIAssistantCard: React.FC<AIAssistantCardProps> = ({ data }) => {
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Hello! I've analyzed your school's live dashboard data. Ask me anything!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);


  const chatContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading]);

  const constructPrompt = (question: string) => {
    const {
      summary = {
        totalStudents: 0,
        totalTeachers: 0,
        feesCollected: 0,
        feesPending: 0,
      },
      classPerformance = [],
      teacherPerformance = [],
      topStudents = [],
      syllabusProgress = [],
      pendingStaffRequests = { leave: 0, attendance: 0, fees: 0 },
      collectionsByGrade = [],
    } = data || {};

    const formatList = (list: any[], formatter: (item: any) => string) =>
      list.length > 0 ? list.map(formatter).join("\n") : "No data available.";

    const context = `
        You are an expert AI Consultant for a School Principal. You have access to the following REAL-TIME dashboard data:

        === SCHOOL OVERVIEW ===
        - Total Students: ${summary.totalStudents}
        - Total Teachers: ${summary.totalTeachers}
        - Financial Health: Collected ₹${(
          summary.feesCollected || 0
        ).toLocaleString()} | Pending ₹${(
      summary.feesPending || 0
    ).toLocaleString()}

        === ACADEMIC PERFORMANCE ===
        **Top Performing Teachers:**
        ${formatList(
          teacherPerformance,
          (t) =>
            `- ${t.teacherName}: Score ${t.avgStudentScore.toFixed(
              1
            )}%, Syllabus ${t.syllabusCompletion.toFixed(
              1
            )}% (Index: ${t.performanceIndex.toFixed(1)})`
        )}

        **Class Performance (Avg Score):**
        ${formatList(
          classPerformance,
          (c) => `- ${c.name}: ${c.performance.toFixed(1)}%`
        )}

        **Top Students:**
        ${formatList(
          topStudents,
          (s) => `- ${s.studentName} (${s.className}): Rank #${s.rank}`
        )}

        === OPERATIONS ===
        **Syllabus Completion:**
        ${formatList(
          syllabusProgress,
          (s) => `- ${s.name}: ${s.progress.toFixed(1)}% completed`
        )}

        **Fee Collection by Grade:**
        ${formatList(
          collectionsByGrade,
          (c) => `- ${c.name}: Collected ₹${c.collected}, Due ₹${c.due}`
        )}

        **Pending Requests:**
        - Leave Applications: ${pendingStaffRequests.leave ?? 0}
        - Attendance Rectifications: ${pendingStaffRequests.attendance ?? 0}

        === USER QUESTION ===
        "${question}"

        === INSTRUCTIONS ===
        1. Answer based ONLY on the data above.
        2. If the data shows "No data available", tell the user you don't have that record yet.
        3. If asked for "Top Teacher", look at the 'Top Performing Teachers' list above and pick the one with the highest Index.
        4. If asked to draft a notice, start with "Subject: ..." and write a professional email/circular.
        `;

    return context;
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
        {
          sender: "ai",
          text: "I'm having trouble analyzing the data right now.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

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


      <div
        ref={chatContainerRef}
        className="flex-grow overflow-y-auto mb-4 pr-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-200"
      >
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
