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
  SearchIcon,
  BookmarkIcon,
  StarIcon,
  MessageSquareIcon,
  ShareIcon,
  ZapIcon,
  BookOpenIcon,
} from "../../components/icons/Icons";

const apiService = new StudentApiService();

// --- TYPES & INTERFACES ---

// Extended type to support our local interactive features
interface EnhancedContent extends CourseContent {
  rating?: number;
  isBookmarked?: boolean;
  progress?: number; // 0 to 100
  comments?: { user: string; text: string; date: string }[];
  difficulty?: "Easy" | "Medium" | "Hard";
  readTime?: string;
}

interface Flashcard {
  question: string;
  answer: string;
}

// --- UTILS ---

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

// --- SUB-COMPONENTS ---

// 1. Flashcard Component
const FlashcardViewer: React.FC<{
  cards: Flashcard[];
  onClose: () => void;
}> = ({ cards, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-slate-50 rounded-xl">
      <div className="mb-4 flex justify-between w-full items-center">
        <h3 className="font-bold text-slate-700">
          Study Flashcards ({currentIndex + 1}/{cards.length})
        </h3>
        <button
          onClick={onClose}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          Exit Study Mode
        </button>
      </div>

      <div
        className={`relative w-full max-w-md h-64 cursor-pointer perspective-1000 transition-all duration-500`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full h-full text-center transition-transform duration-700 transform-style-3d ${
            isFlipped ? "rotate-y-180" : ""
          } shadow-xl rounded-xl`}
        >
          {/* Front */}
          <div
            className={`absolute w-full h-full backface-hidden bg-white border-2 border-brand-primary/20 rounded-xl flex items-center justify-center p-6 ${
              isFlipped ? "hidden" : "block"
            }`}
          >
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                Question
              </p>
              <p className="text-xl font-medium text-slate-800">
                {cards[currentIndex].question}
              </p>
              <p className="text-xs text-slate-400 mt-4">(Click to flip)</p>
            </div>
          </div>
          {/* Back */}
          <div
            className={`absolute w-full h-full backface-hidden bg-brand-primary text-white rounded-xl flex items-center justify-center p-6 ${
              isFlipped ? "block" : "hidden"
            } rotate-y-180`}
          >
            <div>
              <p className="text-xs uppercase tracking-widest text-white/70 mb-2">
                Answer
              </p>
              <p className="text-lg font-medium">
                {cards[currentIndex].answer}
              </p>
            </div>
          </div>
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

// 2. Main Interactive Modal (AI, Chat, Flashcards)
const InteractiveContentModal: React.FC<{
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

  // Discussion State (Mocked)
  const [comments, setComments] = useState(content.comments || []);
  const [newComment, setNewComment] = useState("");

  const fileDataRef = useRef<{ base64: string; mimeType: string } | null>(null);

  // Init Gemini
  const genAI = useMemo(
    () =>
      new GoogleGenerativeAI(
        process.env.REACT_APP_GEMINI_API_KEY || "YOUR_KEY_HERE"
      ),
    []
  );

  // Text-to-Speech
  const handleSpeak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  // 1. Prepare File for AI
  useEffect(() => {
    const prepareFile = async () => {
      try {
        const response = await fetch(content.fileUrl);
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);

        let mimeType = content.fileType;
        if (content.fileType.includes("pdf")) mimeType = "application/pdf";
        else if (content.fileType.includes("image")) mimeType = "image/jpeg"; // Default to jpeg for ease

        fileDataRef.current = { base64, mimeType };
        setMessages([
          {
            sender: "ai",
            text: `I've analyzed "${content.title}". I can create flashcards, summarize this, or answer questions!`,
          },
        ]);
      } catch (err) {
        console.error("File load error", err);
      }
    };
    prepareFile();
  }, [content]);

  // 2. Chat Function
  const handleSend = async () => {
    if (!userInput.trim() || !fileDataRef.current) return;
    const text = userInput;
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
      const response = result.response.text();
      setMessages((prev) => [...prev, { sender: "ai", text: response }]);
      onAddXP(5); // Gamification: 5 XP per question
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Error generating response." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Generate Flashcards
  const generateFlashcards = async () => {
    if (!fileDataRef.current) return;
    setIsGeneratingCards(true);
    setActiveTab("flashcards");
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt =
        'Create 5 study flashcards from this content. Return JSON format: [{ "question": "...", "answer": "..." }]';
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
      // Clean JSON string
      const jsonStr = text.replace(/```json|```/g, "").trim();
      const cards = JSON.parse(jsonStr);
      setFlashcards(cards);
      onAddXP(20); // Gamification: 20 XP for generating cards
    } catch (error) {
      console.error("Flashcard error", error);
      alert("Could not generate flashcards from this file type.");
    } finally {
      setIsGeneratingCards(false);
    }
  };

  // 4. Generate Summary
  const generateSummary = async () => {
    if (!fileDataRef.current) return;
    setActiveTab("summary");
    if (summary) return; // Don't regen if exists

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
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Post Comment
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
      <div className="bg-white w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <ZapIcon className="w-5 h-5 text-brand-secondary" />
            Smart Learning: {content.title}
          </h3>
          <button onClick={onClose}>
            <XIcon className="w-6 h-6 text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-white">
          {[
            { id: "chat", label: "Ask AI", icon: "🤖" },
            { id: "flashcards", label: "Flashcards", icon: "🃏" },
            { id: "summary", label: "Key Takeaways", icon: "📝" },
            { id: "discuss", label: "Discussion", icon: "💬" },
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {/* CHAT TAB */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-4 overflow-y-auto mb-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        msg.sender === "user"
                          ? "bg-brand-primary text-white"
                          : "bg-white border shadow-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="text-slate-400 italic text-sm">
                    Thinking...
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask a question about this file..."
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <Button onClick={handleSend}>
                  <SendIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* FLASHCARDS TAB */}
          {activeTab === "flashcards" && (
            <div className="h-full flex flex-col items-center justify-center">
              {flashcards.length > 0 ? (
                <FlashcardViewer
                  cards={flashcards}
                  onClose={() => setFlashcards([])}
                />
              ) : (
                <div className="text-center">
                  <div className="text-6xl mb-4">🃏</div>
                  <h3 className="text-xl font-bold text-slate-700">
                    Generate Study Cards
                  </h3>
                  <p className="text-slate-500 mb-6">
                    Let AI create quiz cards from this document to help you
                    memorize.
                  </p>
                  <Button
                    onClick={generateFlashcards}
                    disabled={isGeneratingCards}
                  >
                    {isGeneratingCards
                      ? "Generating..."
                      : "Create Flashcards Now"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* SUMMARY TAB */}
          {activeTab === "summary" && (
            <div className="h-full">
              {!summary ? (
                <div className="text-center mt-20">
                  <Button onClick={generateSummary} disabled={isLoading}>
                    {isLoading
                      ? "Summarizing..."
                      : "Generate Summary & Takeaways"}
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

          {/* DISCUSSION TAB */}
          {activeTab === "discuss" && (
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-4 overflow-y-auto mb-4">
                {comments.length === 0 ? (
                  <p className="text-center text-slate-400 py-10">
                    No comments yet. Be the first!
                  </p>
                ) : (
                  comments.map((c, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                        {c.user.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{c.user}</span>
                          <span className="text-xs text-slate-400">
                            {c.date}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="flex-1 px-4 py-2 border rounded-lg text-sm"
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

// --- MAIN PAGE COMPONENT ---

const StudentContent: React.FC = () => {
  const { user } = useAuth();
  const [content, setContent] = useState<EnhancedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] =
    useState<EnhancedContent | null>(null);

  // Filters & State
  const [filter, setFilter] = useState<
    "all" | "video" | "document" | "bookmarked"
  >("all");
  const [xp, setXp] = useState(120); // Initial XP
  const [level, setLevel] = useState(1);

  // Add XP Function (Passed to child)
  const addXP = (amount: number) => {
    const newXp = xp + amount;
    setXp(newXp);
    // Simple level up logic
    if (Math.floor(newXp / 100) > level) {
      setLevel((prev) => prev + 1);
      alert(`🎉 Level Up! You are now Level ${level + 1}`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await apiService.getCourseContentForStudent();
        // Transform to Enhanced Content (Mocking some metadata)
        const enhancedData: EnhancedContent[] = data.map((item) => ({
          ...item,
          rating: Math.floor(Math.random() * 2) + 3, // Random 3-5 stars
          isBookmarked: false,
          progress: Math.floor(Math.random() * 100), // Random progress
          readTime: `${Math.floor(Math.random() * 10) + 2} min`,
          difficulty: ["Easy", "Medium", "Hard"][
            Math.floor(Math.random() * 3)
          ] as any,
        }));
        setContent(enhancedData);
      } catch (e) {
        console.error("Failed to load content", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Handlers
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

  // Grouping
  const groupedContent = useMemo(() => {
    const groups = new Map<string, EnhancedContent[]>();

    filteredContent.forEach((item) => {
      let courseName = "General Resources";

      if (typeof item.course === "object" && item.course?.subject?.name) {
        courseName = item.course.subject.name;
      }

      if (!groups.has(courseName)) {
        groups.set(courseName, []);
      }
      groups.get(courseName)!.push(item);
    });

    return Array.from(groups.entries());
  }, [filteredContent]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header & Gamification Bar */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Learning Hub</h1>
          <p className="text-slate-500 mt-1">
            Explore, interact, and master your subjects.
          </p>
        </div>

        {/* XP Card */}
        <div className="bg-white p-2 pr-4 rounded-full shadow-sm border border-slate-200 flex items-center gap-3">
          <div className="bg-amber-100 text-amber-700 p-2 rounded-full font-bold text-xs border border-amber-200">
            Lvl {level}
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Experience
            </span>
            <span className="text-sm font-bold text-slate-800">{xp} XP</span>
          </div>
          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-2">
            <div
              className="h-full bg-amber-400 rounded-full"
              style={{ width: `${xp % 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: "all", label: "All Materials" },
          { id: "video", label: "Videos" },
          { id: "document", label: "Documents" },
          { id: "bookmarked", label: "My Collection" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === tab.id
                ? "bg-slate-800 text-white shadow-md"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          Loading your learning path...
        </div>
      ) : groupedContent.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
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
        <div className="space-y-8">
          {groupedContent.map(([courseName, items]) => (
            <div key={courseName}>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <BookOpenIcon className="w-5 h-5 text-brand-primary" />
                {courseName}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-all group relative overflow-hidden"
                  >
                    {/* Progress Bar (Top) */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-start mt-2">
                      <div className="bg-slate-100 p-2 rounded-lg text-2xl">
                        {getFileIcon(item.fileType)}
                      </div>
                      <button
                        onClick={() => toggleBookmark(item.id)}
                        className="text-slate-300 hover:text-amber-400 transition-colors"
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

                    <h3 className="font-bold text-slate-800 mt-3 truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 h-8">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-3 mt-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                        ⏱️ {item.readTime}
                      </span>
                      <span
                        className={`px-2 py-1 rounded ${
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

                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                      <div className="flex text-amber-400 text-xs">
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
                        <button
                          onClick={() => setSelectedContent(item)}
                          className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary/90 transition-colors flex items-center gap-1 shadow-sm shadow-brand-primary/30"
                        >
                          <ZapIcon className="w-3 h-3" /> Study
                        </button>
                        <a
                          href={item.fileUrl}
                          download={item.fileName}
                          className="p-1.5 text-slate-400 hover:text-brand-secondary hover:bg-slate-50 rounded-lg transition-colors"
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
        <InteractiveContentModal
          content={selectedContent}
          onClose={() => setSelectedContent(null)}
          onAddXP={addXP}
        />
      )}
    </div>
  );
};

export default StudentContent;
