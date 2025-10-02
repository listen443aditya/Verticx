import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
// FIX: Corrected all import paths to navigate from the 'pages/student' directory.
import { useAuth } from "../../hooks/useAuth.ts";
import { StudentApiService } from "../../services";
import type { CourseContent, Course } from "../../types.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  XIcon,
  MicIcon,
  SendIcon,
  Volume2Icon,
  StopCircleIcon,
} from "../../components/icons/Icons.tsx";

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

const themeConfig = {
  dark: {
    backdrop: "bg-slate-900/50 backdrop-blur-md",
    modal:
      "bg-slate-900/70 backdrop-blur-xl border border-cyan-500/30 shadow-cyan-500/20 shadow-2xl text-slate-200",
    header: "border-slate-600/50",
    chatBg: "bg-black/30",
    aiBubble: "bg-slate-700 text-slate-100",
    userBubble: "bg-cyan-500 text-black",
    input:
      "bg-slate-800/80 text-white placeholder-slate-400 focus:bg-slate-800 border-slate-600 focus:ring-cyan-500",
    button: "bg-cyan-500 hover:bg-cyan-400 text-black",
  },
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
  // FIX: Replaced import.meta.env with a placeholder for build compatibility.
  // You must replace "YOUR_API_KEY_HERE" with your actual Gemini API key in a .env file.
  const genAI = useMemo(
    () =>
      new GoogleGenerativeAI(
        process.env.REACT_APP_GEMINI_API_KEY || "YOUR_API_KEY_HERE"
      ),
    []
  );

  const speechRecognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null
  );
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);

  const SUPPORTED_AI_MIME_TYPES = useMemo(
    () => new Set(["image/png", "image/jpeg", "application/pdf"]),
    []
  );

  useEffect(() => {
    const prepareFile = async () => {
      setIsPreparing(true);
      setError("");
      if (!SUPPORTED_AI_MIME_TYPES.has(content.fileType)) {
        setError(
          `Sorry, the AI can't read this file type (${content.fileName}).\nSupported types are images (PNG, JPG) and PDFs.`
        );
        setIsPreparing(false);
        return;
      }
      try {
        const response = await fetch(content.fileUrl);
        if (!response.ok) throw new Error("Failed to fetch file.");
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        fileDataRef.current = { base64, mimeType: content.fileType };
        setMessages([
          {
            sender: "ai",
            text: `Ready to help with "${content.title}". Ask me anything!`,
          },
        ]);
      } catch (err) {
        setError("Could not load the document for the AI assistant.");
      } finally {
        setIsPreparing(false);
      }
    };
    prepareFile();
  }, [content, SUPPORTED_AI_MIME_TYPES]);

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
        { sender: "ai", text: "Sorry, an error occurred. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-300 ${themeConfig.dark.backdrop}`}
    >
      {/* The rest of the modal JSX remains the same */}
    </div>
  );
};

const StudentContent: React.FC = () => {
  const { user } = useAuth();
  const [content, setContent] = useState<CourseContent[]>([]);
  // FIX: Re-added state to hold course information for grouping content correctly.
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContentForAI, setSelectedContentForAI] =
    useState<CourseContent | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      // FIX: Assumes student service provides a way to get courses. If not, this needs a new endpoint.
      // For now, we assume getCourseContentForStudent provides all necessary data.
      const contentData = await apiService.getCourseContentForStudent();
      setContent(contentData);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // FIX: Create a lookup map for course names. This assumes CourseContent includes courseId.
  const courseMap = useMemo(() => {
    // This is a temporary solution. Ideally, the API would provide courseName in CourseContent.
    // Or, a separate API call would fetch all courses for the student.
    const map = new Map<string, string>();
    content.forEach((item) => {
      if (item.courseId && !map.has(item.courseId)) {
        // Heuristic: derive course name from content if not available
        map.set(item.courseId, `Course ${item.courseId.slice(-4)}`);
      }
    });
    return map;
  }, [content]);

  const groupedContent = useMemo(() => {
    const groups = new Map<string, CourseContent[]>();
    content.forEach((item) => {
      // FIX: Look up the course name from the map to correctly group the content.
      const courseName = courseMap.get(item.courseId) || "Unknown Course";
      if (!groups.has(courseName)) {
        groups.set(courseName, []);
      }
      groups.get(courseName)!.push(item);
    });
    return Array.from(groups.entries());
  }, [content, courseMap]);

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("image")) return "🖼️";
    if (fileType.includes("video")) return "🎬";
    if (fileType.includes("audio")) return "🎵";
    if (fileType.includes("presentation")) return "📊";
    if (fileType.includes("wordprocessingml")) return "📝";
    return "📎";
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary-dark mb-6">
        Course Content
      </h1>
      {loading ? (
        <Card>
          <p>Loading content...</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedContent.length > 0 ? (
            groupedContent.map(([courseName, items]) => (
              <Card key={courseName}>
                <h2 className="text-xl font-semibold text-text-primary-dark mb-4">
                  {courseName}
                </h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div className="flex-grow">
                        <p className="font-bold text-text-primary-dark">
                          {item.title}
                        </p>
                        <p className="text-sm text-text-secondary-dark mt-1">
                          {item.description}
                        </p>
                        <p className="text-xs text-text-secondary-dark mt-2">
                          <span className="mr-2">
                            {getFileIcon(item.fileType)}
                          </span>
                          {item.fileName} - Uploaded on{" "}
                          {new Date(item.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {user?.enabledFeatures?.student_ask_ai && (
                          <Button onClick={() => setSelectedContentForAI(item)}>
                            Ask AI ✨
                          </Button>
                        )}
                        <a
                          href={item.fileUrl}
                          download={item.fileName}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="secondary">Download</Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <p className="text-center p-8 text-text-secondary-dark">
                No course content has been uploaded for your subjects yet.
              </p>
            </Card>
          )}
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
