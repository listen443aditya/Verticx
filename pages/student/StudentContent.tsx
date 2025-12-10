import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { StudentApiService } from "../../services";
import type { CourseContent } from "../../types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  XIcon,
  MicIcon,
  SendIcon,
  StopCircleIcon,
} from "../../components/icons/Icons";

const apiService = new StudentApiService();

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const AIContentAssistantModal: React.FC<{
  content: CourseContent;
  onClose: () => void;
}> = ({ content, onClose }) => {
  const [messages, setMessages] = useState<
    { sender: "ai" | "user"; text: string }[]
  >([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(true);
  const [error, setError] = useState("");

  const fileDataRef = useRef<{ base64: string; mimeType: string } | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini AI
 const genAI = useMemo(
   () =>
     new GoogleGenerativeAI(
       process.env.GEMINI_API_KEY || "API_KEY_HERE"
     ),
   []
 );

  const SUPPORTED_AI_MIME_TYPES = useMemo(
    () => new Set(["image/png", "image/jpeg", "application/pdf"]),
    []
  );

  useEffect(() => {
    const prepareFile = async () => {
      setIsPreparing(true);
      setError("");

      // Basic MIME type check based on file extension/type string
      const isSupported =
        content.fileType.includes("image") || content.fileType.includes("pdf");

      if (!isSupported) {
        setError(
          `Sorry, the AI currently supports images (PNG, JPG) and PDFs only.`
        );
        setIsPreparing(false);
        return;
      }

      try {
        const response = await fetch(content.fileUrl);
        if (!response.ok) throw new Error("Failed to fetch file.");
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);

        // Determine correct mime type for API
        let mimeType = content.fileType;
        if (content.fileType.includes("pdf")) mimeType = "application/pdf";
        else if (content.fileType.includes("png")) mimeType = "image/png";
        else if (
          content.fileType.includes("jpeg") ||
          content.fileType.includes("jpg")
        )
          mimeType = "image/jpeg";

        fileDataRef.current = { base64, mimeType };

        setMessages([
          {
            sender: "ai",
            text: `I've analyzed "${content.title}". Ask me anything about it!`,
          },
        ]);
      } catch (err) {
        console.error(err);
        setError("Could not load the document for the AI assistant.");
      } finally {
        setIsPreparing(false);
      }
    };
    prepareFile();
  }, [content]);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = async (promptText?: string) => {
    const text = (promptText || userInput).trim();
    if (!text || isLoading || isPreparing || !fileDataRef.current) return;

    setMessages((prev) => [...prev, { sender: "user", text }]);
    setUserInput("");
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: fileDataRef.current.mimeType,
            data: fileDataRef.current.base64,
          },
        },
        { text },
      ]);
      const response = result.response;
      const responseText =
        response.text() ?? "Sorry, I couldn't generate a response.";
      setMessages((prev) => [...prev, { sender: "ai", text: responseText }]);
    } catch (err) {
      console.error("Gemini API error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Sorry, I encountered an error processing that request.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl h-[600px] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            ✨ AI Assistant{" "}
            <span className="text-xs font-normal text-slate-500">
              ({content.fileName})
            </span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
        >
          {error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm text-center">
              {error}
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    msg.sender === "user"
                      ? "bg-brand-primary text-white rounded-tr-none"
                      : "bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 p-3 rounded-lg rounded-tl-none text-sm text-slate-500 italic shadow-sm">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about this document..."
              disabled={isLoading || !!error || isPreparing}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 disabled:bg-slate-50 disabled:text-slate-400"
            />
            <Button
              onClick={() => handleSend()}
              disabled={
                isLoading || !!error || isPreparing || !userInput.trim()
              }
              className="px-4"
            >
              <SendIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentContent: React.FC = () => {
  const { user } = useAuth();
  const [content, setContent] = useState<CourseContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContentForAI, setSelectedContentForAI] =
    useState<CourseContent | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const contentData = await apiService.getCourseContentForStudent();
        setContent(contentData);
      } catch (e) {
        console.error("Failed to load content", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Group content by Course Name (Subject)
  const groupedContent = useMemo(() => {
    const groups = new Map<string, CourseContent[]>();

    content.forEach((item: any) => {
      // FIX: Use the nested subject name from the backend
      const courseName =
        item.course?.subject?.name || item.courseId || "General Resources";

      if (!groups.has(courseName)) {
        groups.set(courseName, []);
      }
      groups.get(courseName)!.push(item);
    });

    return Array.from(groups.entries());
  }, [content]);

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("image")) return "🖼️";
    if (fileType.includes("video")) return "🎬";
    if (fileType.includes("audio")) return "🎵";
    return "📎";
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Course Content
      </h1>

      {loading ? (
        <Card>
          <div className="p-8 text-center text-slate-500">
            Loading study materials...
          </div>
        </Card>
      ) : groupedContent.length === 0 ? (
        <Card>
          <div className="p-12 text-center text-slate-500">
            <p className="text-lg">No course content available yet.</p>
            <p className="text-sm mt-2">
              Check back later when teachers upload materials.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {groupedContent.map(([courseName, items]) => (
            <Card key={courseName}>
              <h2 className="text-xl font-bold text-brand-secondary mb-4 border-b border-slate-100 pb-2">
                {courseName}
              </h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-slate-50 hover:bg-slate-100 border border-slate-200 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all"
                  >
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl" role="img" aria-label="icon">
                          {getFileIcon(item.fileType)}
                        </span>
                        <p className="font-bold text-text-primary-dark text-lg">
                          {item.title}
                        </p>
                      </div>
                      <p className="text-sm text-text-secondary-dark pl-9">
                        {item.description}
                      </p>
                      <p className="text-xs text-slate-400 mt-2 pl-9">
                        {item.fileName} • Uploaded{" "}
                        {new Date(item.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-3 pl-9 sm:pl-0">
                      {/* FIX: Removed strict feature flag check to ensure button appears */}
                      <Button
                        onClick={() => setSelectedContentForAI(item)}
                        variant="secondary"
                        className="flex items-center gap-2 !bg-purple-100 !text-purple-700 hover:!bg-purple-200 border-purple-200"
                      >
                        <span>Ask AI</span>
                        <span>✨</span>
                      </Button>

                      <a
                        href={item.fileUrl}
                        download={item.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button>Download</Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedContentForAI && (
        <AIContentAssistantModal
          content={selectedContentForAI}
          onClose={() => setSelectedContentForAI(null)}
        />
      )}
    </div>
  );
};

export default StudentContent;
