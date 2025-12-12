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
  SearchIcon,
  BookmarkIcon,
  StarIcon,
  MessageSquareIcon,
  ShareIcon,
  ZapIcon,
  BookOpenIcon,
} from "../../components/icons/Icons";

// Initialize API Service
const apiService = new StudentApiService();

// --- TYPES & INTERFACES ---

interface EnhancedContent extends CourseContent {
  rating?: number;
  isBookmarked?: boolean;
  progress?: number;
  comments?: { user: string; text: string; date: string }[];
  difficulty?: "Easy" | "Medium" | "Hard";
  readTime?: string;
}

interface Flashcard {
  question: string;
  answer: string;
}

// --- HELPER FUNCTIONS ---

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

const getFileIcon = (fileType: string) => {
  if (fileType.includes("pdf")) return "📄";
  if (fileType.includes("image")) return "🖼️";
  if (fileType.includes("video")) return "🎬";
  if (fileType.includes("audio")) return "🎵";
  return "📎";
};

const getStableNumber = (seed: string, range: number, offset: number = 0) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash) % range) + offset;
};

// --- SUB-COMPONENTS ---

const FlashcardViewer: React.FC<{
  cards: Flashcard[];
  onClose: () => void;
}> = ({ cards, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev + 1) % cards.length), 200);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(
      () => setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length),
      200
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-slate-50 rounded-xl">
      <div className="mb-4 flex justify-between w-full items-center">
        <h3 className="font-bold text-slate-700">
          Study Flashcards ({currentIndex + 1}/{cards.length})
        </h3>
        <button
          onClick={onClose}
          className="text-sm text-slate-500 hover:text-slate-800 underline"
        >
          Exit
        </button>
      </div>

      <div
        className="relative w-full max-w-md h-64 cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full h-full text-center transition-transform duration-500 transform-style-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front */}
          {!isFlipped && (
            <div className="absolute inset-0 bg-white border-2 border-brand-primary/20 rounded-xl flex flex-col items-center justify-center p-6 shadow-md">
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-4">
                Question
              </p>
              <p className="text-xl font-medium text-slate-800">
                {cards[currentIndex].question}
              </p>
              <p className="text-xs text-slate-400 mt-6">(Click to flip)</p>
            </div>
          )}
          {/* Back */}
          {isFlipped && (
            <div className="absolute inset-0 bg-brand-primary text-white rounded-xl flex flex-col items-center justify-center p-6 shadow-md">
              <p className="text-xs uppercase tracking-widest text-white/70 mb-4">
                Answer
              </p>
              <p className="text-lg font-medium">
                {cards[currentIndex].answer}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <Button variant="secondary" onClick={handlePrev}>
          Previous
        </Button>
        <Button onClick={handleNext}>Next Card</Button>
      </div>
    </div>
  );
};

const AIContentAssistantModal: React.FC<{
  content: EnhancedContent;
  onClose: () => void;
  onAddXP: (amount: number) => void;
}> = ({ content, onClose, onAddXP }) => {
  const [activeTab, setActiveTab] = useState<
    "chat" | "flashcards" | "summary" | "discuss"
  >("chat");
  const [messages, setMessages] = useState<
    { sender: "ai" | "user"; text: string }[]
  >([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [summary, setSummary] = useState("");
  const [comments, setComments] = useState(content.comments || []);
  const [newComment, setNewComment] = useState("");

  const fileDataRef = useRef<{ base64: string; mimeType: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini AI (Using process.env)
  const genAI = useMemo(
    () => new GoogleGenerativeAI(process.env.GEMINI_API_KEY || ""),
    []
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSpeak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const prepareFile = async () => {
      try {
        const response = await fetch(content.fileUrl);
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);

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
            text: `I've analyzed "${content.title}". I'm ready to help you study!`,
          },
        ]);
      } catch (err) {
        console.error("File load error", err);
        setMessages([
          {
            sender: "ai",
            text: "Error loading file. Please try a different document.",
          },
        ]);
      }
    };
    prepareFile();
  }, [content]);

  const handleSend = async () => {
    if (!userInput.trim() || !fileDataRef.current) return;
    const text = userInput;
    setUserInput("");
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      setMessages((prev) => [...prev, { sender: "ai", text: "" }]); // Placeholder

      const result = await model.generateContentStream([
        {
          inlineData: {
            mimeType: fileDataRef.current.mimeType,
            data: fileDataRef.current.base64,
          },
        },
        { text },
      ]);

      let fullResponse = "";
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        setMessages((prev) => {
          const newMsgs = [...prev];
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg.sender === "ai") lastMsg.text = fullResponse;
          return newMsgs;
        });
      }
      onAddXP(5);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFlashcards = async () => {
    if (!fileDataRef.current) return;
    setIsGeneratingCards(true);
    setActiveTab("flashcards");
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt =
        'Create 5 study flashcards from this content. Return strict JSON format: [{ "question": "...", "answer": "..." }]';
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: fileDataRef.current.mimeType,
            data: fileDataRef.current.base64,
          },
        },
        { text: prompt },
      ]);
      const text = result.response.text();
      const jsonStr = text.replace(/```json|```/g, "").trim();
      const cards = JSON.parse(jsonStr);
      setFlashcards(cards);
      onAddXP(20);
    } catch (error) {
      console.error("Flashcard error", error);
      alert("Could not generate flashcards. Please try again.");
    } finally {
      setIsGeneratingCards(false);
    }
  };

  const generateSummary = async () => {
    if (!fileDataRef.current) return;
    setActiveTab("summary");
    if (summary) return;

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
        { text: "Provide a concise summary with 3 key takeaways." },
      ]);
      setSummary(result.response.text());
      onAddXP(10);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    setComments((prev) => [
      ...prev,
      { user: "You", text: newComment, date: "Just now" },
    ]);
    setNewComment("");
    onAddXP(5);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <ZapIcon className="w-5 h-5 text-brand-secondary" /> Smart Learning:{" "}
            {content.title}
          </h3>
          <button onClick={onClose}>
            <XIcon className="w-6 h-6 text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        <div className="flex border-b border-slate-200 bg-white">
          {[
            { id: "chat", label: "Ask AI", icon: "🤖" },
            { id: "flashcards", label: "Flashcards", icon: "🃏" },
            { id: "summary", label: "Summary", icon: "📝" },
            { id: "discuss", label: "Discuss", icon: "💬" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-brand-primary text-brand-primary bg-brand-primary/5"
                  : "border-transparent text-slate-500 hover:bg-slate-50"
              }`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {activeTab === "chat" && (
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-4 overflow-y-auto mb-4 pr-2">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                        msg.sender === "user"
                          ? "bg-brand-primary text-white rounded-tr-none"
                          : "bg-white border border-slate-200 text-slate-700 rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2 bg-white p-2 rounded-lg border border-slate-200">
                <input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !isLoading && handleSend()
                  }
                  placeholder={
                    isLoading ? "AI is thinking..." : "Ask a question..."
                  }
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 outline-none text-sm"
                />
                <Button
                  onClick={handleSend}
                  disabled={isLoading || !userInput.trim()}
                  className="rounded-lg"
                >
                  <SendIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {activeTab === "flashcards" && (
            <div className="h-full flex flex-col items-center justify-center">
              {flashcards.length > 0 ? (
                <FlashcardViewer
                  cards={flashcards}
                  onClose={() => setFlashcards([])}
                />
              ) : (
                <div className="text-center max-w-sm">
                  <div className="text-6xl mb-4">🃏</div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">
                    Generate Study Cards
                  </h3>
                  <p className="text-slate-500 mb-6 text-sm">
                    AI creates quiz cards from this document to help you
                    memorize.
                  </p>
                  <Button
                    onClick={generateFlashcards}
                    disabled={isGeneratingCards}
                    className="w-full"
                  >
                    {isGeneratingCards ? "Generating..." : "Create Flashcards"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === "summary" && (
            <div className="h-full">
              {!summary ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">
                    AI Summary
                  </h3>
                  <p className="text-slate-500 mb-6 text-sm">
                    Get a quick overview and key takeaways.
                  </p>
                  <Button onClick={generateSummary} disabled={isLoading}>
                    {isLoading ? "Summarizing..." : "Generate Summary"}
                  </Button>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-slate-800">
                      Key Takeaways
                    </h3>
                    <button
                      onClick={() => handleSpeak(summary)}
                      className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100"
                      title="Read Aloud"
                    >
                      <MicIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="prose prose-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {summary}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "discuss" && (
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-4 overflow-y-auto mb-4">
                {comments.length === 0 ? (
                  <div className="text-center text-slate-400 py-10 flex flex-col items-center">
                    <MessageSquareIcon className="w-12 h-12 mb-2 opacity-20" />
                    <p>No comments yet. Start the discussion!</p>
                  </div>
                ) : (
                  comments.map((c, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {c.user.charAt(0)}
                      </div>
                      <div className="bg-white p-3 rounded-lg rounded-tl-none border border-slate-100 shadow-sm flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-800">
                            {c.user}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {c.date}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-200">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
                <Button onClick={handlePostComment} variant="secondary">
                  Post
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

const StudentContent: React.FC = () => {
  const { user } = useAuth();
  const [content, setContent] = useState<EnhancedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] =
    useState<EnhancedContent | null>(null);

  const [filter, setFilter] = useState<
    "all" | "video" | "document" | "bookmarked"
  >("all");
  const [xp, setXp] = useState(120);
  const [level, setLevel] = useState(1);

  const addXP = (amount: number) => {
    const newXp = xp + amount;
    setXp(newXp);
    if (Math.floor(newXp / 100) > level) {
      setLevel((prev) => prev + 1);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await apiService.getCourseContentForStudent();

        // FIX: Use Stable Randomness based on ID
        const enhancedData: EnhancedContent[] = data.map((item) => {
          // Use ID to determine stable stats
          const rating = getStableNumber(item.id, 3, 3); // 3-5 stars
          const progress = getStableNumber(item.id, 100); // 0-100%
          const readTimeMin = getStableNumber(item.id, 15, 2); // 2-17 mins
          const difficultyIndex = getStableNumber(item.id, 3); // 0, 1, or 2

          return {
            ...item,
            rating: rating,
            isBookmarked: false,
            progress: progress,
            readTime: `${readTimeMin} min`,
            difficulty: ["Easy", "Medium", "Hard"][difficultyIndex] as any,
          };
        });

        setContent(enhancedData);
      } catch (e) {
        console.error("Failed to load content", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const toggleBookmark = (id: string) => {
    setContent((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, isBookmarked: !c.isBookmarked } : c
      )
    );
  };

  const filteredContent = useMemo(() => {
    return content.filter((item) => {
      if (filter === "bookmarked") return item.isBookmarked;
      if (filter === "video") return item.fileType.includes("video");
      if (filter === "document")
        return item.fileType.includes("pdf") || item.fileType.includes("image");
      return true;
    });
  }, [content, filter]);

  const groupedContent = useMemo(() => {
    const groups = new Map<string, EnhancedContent[]>();
    filteredContent.forEach((item) => {
      let courseName = "General Resources";
      if (
        typeof item.course === "object" &&
        item.course !== null &&
        (item.course as any).subject?.name
      ) {
        courseName = (item.course as any).subject.name;
      } else if (item.courseId) {
        courseName = `Subject (${item.courseId.substring(0, 4)}...)`;
      }
      if (!groups.has(courseName)) groups.set(courseName, []);
      groups.get(courseName)!.push(item);
    });
    return Array.from(groups.entries());
  }, [filteredContent]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Learning Hub</h1>
          <p className="text-slate-500 mt-1">
            Explore resources, ask AI, and track your progress.
          </p>
        </div>

        {/* XP Card */}
        <div className="bg-white p-2 pr-4 rounded-full shadow-sm border border-slate-200 flex items-center gap-3">
          <div className="bg-amber-100 text-amber-700 p-2 rounded-full font-bold text-xs border border-amber-200 shadow-sm">
            Lvl {level}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Experience
            </span>
            <span className="text-sm font-bold text-slate-800">{xp} XP</span>
          </div>
          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-2">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${xp % 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: "all", label: "All Materials" },
          { id: "video", label: "Videos" },
          { id: "document", label: "Documents" },
          { id: "bookmarked", label: "My Collection" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              filter === tab.id
                ? "bg-slate-800 text-white shadow-md transform scale-105"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 animate-pulse">
          Loading study materials...
        </div>
      ) : groupedContent.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <SearchIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-lg text-slate-500">
            No content found in this category.
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => setFilter("all")}
          >
            View All
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {groupedContent.map(([courseName, items]) => (
            <div key={courseName}>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                <BookOpenIcon className="w-5 h-5 text-brand-primary" />{" "}
                {courseName}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-all group relative overflow-hidden flex flex-col h-full"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
                      <div
                        className="h-full bg-green-500 transition-all duration-1000"
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-start mt-2 mb-2">
                      <div className="bg-slate-50 p-2 rounded-lg text-2xl border border-slate-100">
                        {getFileIcon(item.fileType)}
                      </div>
                      <button
                        onClick={() => toggleBookmark(item.id)}
                        className="text-slate-300 hover:text-amber-400 transition-colors p-1"
                      >
                        <BookmarkIcon
                          className={`w-5 h-5 ${
                            item.isBookmarked
                              ? "fill-amber-400 text-amber-400"
                              : ""
                          }`}
                        />
                      </button>
                    </div>

                    <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 h-8">
                      {item.description || "No description provided."}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-4">
                      <span className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-medium">
                        ⏱️ {item.readTime}
                      </span>
                      <span
                        className={`px-2 py-1 rounded font-medium ${
                          item.difficulty === "Easy"
                            ? "bg-green-50 text-green-700"
                            : item.difficulty === "Medium"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {item.difficulty}
                      </span>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-3 h-3 ${
                              i < (item.rating || 0)
                                ? "fill-current"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>

                      <div className="flex gap-2">
                        {/* FIX: Removed env check to force button visibility */}
                        <button
                          onClick={() => setSelectedContent(item)}
                          className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary/90 transition-all flex items-center gap-1 shadow-sm shadow-brand-primary/30"
                        >
                          <ZapIcon className="w-3 h-3" /> Study
                        </button>
                        <a
                          href={item.fileUrl}
                          download={item.fileName}
                          className="p-1.5 text-slate-400 hover:text-brand-secondary hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                        >
                          <ShareIcon className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedContent && (
        <AIContentAssistantModal
          content={selectedContent}
          onClose={() => setSelectedContent(null)}
          onAddXP={addXP}
        />
      )}
    </div>
  );
};

export default StudentContent;
