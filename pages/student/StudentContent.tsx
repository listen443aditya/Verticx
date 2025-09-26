import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { studentApiService as apiService } from '../../services';
import type { CourseContent, Course } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import { GoogleGenAI } from "@google/genai";
import { XIcon, MicIcon, SendIcon, Volume2Icon, StopCircleIcon } from '../../components/icons/Icons.tsx';
import Input from '../../components/ui/Input.tsx';

// Helper to convert a Blob to a Base64 string, removing the data URL prefix.
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- Futuristic AI Assistant Modal ---

const themeConfig = {
    light: {
        backdrop: 'bg-black/30 backdrop-blur-sm',
        modal: 'bg-white/70 backdrop-blur-xl border border-white/20',
        header: 'border-slate-300/50',
        chatBg: 'bg-slate-100',
        aiBubble: 'bg-white text-text-primary-dark shadow-sm',
        userBubble: 'bg-brand-primary text-white',
        input: 'bg-white/80 focus:bg-white text-text-primary-dark placeholder-slate-500',
        button: 'bg-slate-600 hover:bg-slate-700 text-white',
        themeButtonActive: 'bg-slate-700 text-white',
        themeButtonInactive: 'bg-slate-200 text-slate-600 hover:bg-slate-300'
    },
    dark: {
        backdrop: 'bg-slate-900/50 backdrop-blur-md',
        modal: 'bg-slate-900/70 backdrop-blur-xl border border-cyan-500/30 shadow-cyan-500/20 shadow-2xl text-slate-200',
        header: 'border-slate-600/50',
        chatBg: 'bg-black/30',
        aiBubble: 'bg-slate-700 text-slate-100',
        userBubble: 'bg-cyan-500 text-black',
        input: 'bg-slate-800/80 text-white placeholder-slate-400 focus:bg-slate-800 border-slate-600 focus:ring-cyan-500',
        button: 'bg-cyan-500 hover:bg-cyan-400 text-black',
        themeButtonActive: 'bg-cyan-500 text-black',
        themeButtonInactive: 'bg-slate-700 text-slate-300 hover:bg-slate-600'
    },
    holo: {
        backdrop: 'bg-blue-900/60 backdrop-blur-lg',
        modal: 'bg-blue-900/60 backdrop-blur-xl border border-sky-400/40 shadow-sky-400/20 shadow-2xl text-sky-100',
        header: 'border-sky-500/50',
        chatBg: 'bg-blue-950/40',
        aiBubble: 'bg-sky-800/80 text-sky-100',
        userBubble: 'bg-sky-400 text-black',
        input: 'bg-blue-950/70 text-white placeholder-sky-300 focus:bg-blue-950 border-sky-700 focus:ring-sky-400',
        button: 'bg-sky-400 hover:bg-sky-300 text-black',
        themeButtonActive: 'bg-sky-400 text-black',
        themeButtonInactive: 'bg-sky-800 text-sky-200 hover:bg-sky-700'
    }
};

type AiTheme = keyof typeof themeConfig;

const AIContentAssistantModal: React.FC<{ content: CourseContent; onClose: () => void; }> = ({ content, onClose }) => {
    const [isPreparing, setIsPreparing] = useState(true);
    const [error, setError] = useState('');
    const [messages, setMessages] = useState<{ sender: 'ai' | 'user'; text: string; }[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [isListening, setIsListening] = useState(false);
    const speechRecognitionRef = useRef<any>(null);
    
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

    const [aiTheme, setAiTheme] = useState<AiTheme>('dark');
    const currentTheme = themeConfig[aiTheme];

    const fileDataRef = useRef<{ base64: string; mimeType: string } | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY }), []);

    const SUPPORTED_AI_MIME_TYPES = useMemo(() => new Set(['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']), []);

    useEffect(() => {
        const prepareFile = async () => {
            setIsPreparing(true);
            setError('');
            if (!SUPPORTED_AI_MIME_TYPES.has(content.fileType)) {
                let helpfulMessage = `Sorry, the AI assistant cannot read this file type directly (${content.fileName}).`;
                if (content.fileType.includes('wordprocessingml')) {
                    helpfulMessage += "\n\nTo analyze this document, please save it as a PDF or copy and paste the text into our chat.";
                } else {
                    helpfulMessage += "\n\nSupported types are images (PNG, JPG) and PDFs.";
                }
                setError(helpfulMessage);
                setIsPreparing(false);
                return;
            }
            try {
                const response = await fetch(content.fileUrl);
                if (!response.ok) throw new Error('Failed to fetch file content.');
                const blob = await response.blob();
                const base64 = await blobToBase64(blob);
                fileDataRef.current = { base64, mimeType: content.fileType };
                setMessages([{ sender: 'ai', text: `Hi! I'm ready to help with "${content.title}". Ask me to summarize it or ask any specific questions.` }]);
            } catch (err) {
                console.error("Error preparing file for AI:", err);
                setError('Could not load the document for the AI assistant.');
            } finally {
                setIsPreparing(false);
            }
        };
        prepareFile();
    }, [content, SUPPORTED_AI_MIME_TYPES]);
    
    useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        speechRecognitionRef.current = new SpeechRecognition();
        const recognition = speechRecognitionRef.current;
        recognition.continuous = false; recognition.interimResults = false; recognition.lang = 'en-US';
        recognition.onresult = (event: any) => handleSend(event.results[0][0].transcript);
        recognition.onerror = (event: any) => { console.error("Speech recognition error:", event.error); setIsListening(false); };
        recognition.onend = () => setIsListening(false);
        return () => { if (recognition) recognition.stop(); window.speechSynthesis.cancel(); };
    }, []);

    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                const bestVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) || voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en'));
                setSelectedVoice(bestVoice || voices[0]);
            }
        };
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
        return () => { window.speechSynthesis.onvoiceschanged = null; };
    }, []);

    const handleSend = async (promptText?: string) => {
        const text = (promptText || userInput).trim();
        if (!text || isLoading || isPreparing || !fileDataRef.current) return;
        setMessages(prev => [...prev, { sender: 'user', text }]);
        setUserInput('');
        setIsLoading(true);
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ inlineData: { mimeType: fileDataRef.current.mimeType, data: fileDataRef.current.base64 }}, { text }] }
            });
            setMessages(prev => [...prev, { sender: 'ai', text: response.text }]);
        } catch (err) {
            console.error("Gemini API error:", err);
            setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleListening = () => {
        if (!speechRecognitionRef.current) return;
        if (isListening) {
            speechRecognitionRef.current.stop();
        } else {
            speechRecognitionRef.current.start();
        }
        setIsListening(!isListening);
    };

    const handleSpeak = (text: string, messageId: string) => {
        const synth = window.speechSynthesis;
        if (synth.speaking && speakingMessageId === messageId) {
            synth.cancel();
            return;
        }
        if (synth.speaking) {
            synth.cancel();
        }
        const utterance = new SpeechSynthesisUtterance(text);
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.onend = () => setSpeakingMessageId(null);
        utterance.onerror = (event) => { console.error("Speech synthesis error:", event); setSpeakingMessageId(null); };
        setSpeakingMessageId(messageId);
        synth.speak(utterance);
    };
    
    return (
        <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-300 ${currentTheme.backdrop}`} aria-modal="true" role="dialog">
            <div className={`w-full max-w-2xl h-[90vh] flex flex-col rounded-2xl p-6 transition-all duration-300 ${currentTheme.modal}`}>
                <div className={`flex justify-between items-center mb-4 pb-3 ${currentTheme.header}`}>
                    <div>
                        <h2 className="text-xl font-bold">AI Assistant</h2>
                        <p className="text-sm opacity-80 truncate">File: {content.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center p-1 bg-black/20 rounded-full">
                            {(['dark', 'holo', 'light'] as AiTheme[]).map(theme => (
                                <button key={theme} onClick={() => setAiTheme(theme)} className={`px-3 py-1 text-xs rounded-full transition-colors ${aiTheme === theme ? currentTheme.themeButtonActive : currentTheme.themeButtonInactive}`}>
                                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                </button>
                            ))}
                        </div>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-black/20"><XIcon className="w-6 h-6" /></button>
                    </div>
                </div>
                
                <div ref={chatContainerRef} className={`flex-grow overflow-y-auto mb-4 p-4 rounded-lg space-y-4 ${currentTheme.chatBg}`}>
                    {isPreparing && <p className="text-center p-4">Preparing document for AI...</p>}
                    {error && <p className="text-center p-4 text-red-400 whitespace-pre-wrap">{error}</p>}
                    {!isPreparing && !error && messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-md rounded-lg px-4 py-2 relative group ${msg.sender === 'user' ? currentTheme.userBubble : currentTheme.aiBubble}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                {msg.sender === 'ai' && (
                                     <button onClick={() => handleSpeak(msg.text, `msg-${index}`)} className={`absolute -bottom-3 -right-3 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${currentTheme.themeButtonInactive}`} aria-label={speakingMessageId === `msg-${index}` ? "Stop speaking" : "Listen"}>
                                        {speakingMessageId === `msg-${index}` ? <StopCircleIcon className="w-4 h-4" /> : <Volume2Icon className="w-4 h-4" />}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                     {isLoading && (
                         <div className="flex justify-start">
                             <div className={`max-w-md rounded-lg px-4 py-2 ${currentTheme.aiBubble}`}>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-current opacity-60 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-current opacity-60 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                    <div className="w-2 h-2 bg-current opacity-60 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mb-4">
                    <Button variant="secondary" onClick={() => handleSend("Please provide a concise summary of this document.")} disabled={isLoading || isPreparing || !!error}>Summarize</Button>
                </div>

                <div className="flex gap-2 items-center">
                    <input 
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                        placeholder="Ask a question about the file..."
                        className={`w-full rounded-lg py-3 px-4 text-sm transition-colors border focus:outline-none focus:ring-2 ${currentTheme.input}`}
                        disabled={isLoading || isPreparing || !!error}
                    />
                     <Button onClick={handleToggleListening} disabled={!speechRecognitionRef.current || isLoading || isPreparing || !!error} className={`!p-3 ${isListening ? '!bg-red-500 hover:!bg-red-600' : currentTheme.button}`} aria-label={isListening ? "Stop listening" : "Start voice input"}>
                        <MicIcon className="w-5 h-5"/>
                    </Button>
                    <Button onClick={() => handleSend()} disabled={isLoading || isPreparing || !userInput.trim() || !!error} className={`!p-3 ${currentTheme.button}`}>
                        <SendIcon className="w-5 h-5"/>
                    </Button>
                </div>
            </div>
        </div>
    );
};


const StudentContent: React.FC = () => {
    const { user } = useAuth();
    const [content, setContent] = useState<CourseContent[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedContentForAI, setSelectedContentForAI] = useState<CourseContent | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.branchId) return;
            setLoading(true);
            const [contentData, courseData] = await Promise.all([
                apiService.getCourseContentForStudent(user.id),
                apiService.getCoursesByBranch(user.branchId)
            ]);
            setContent(contentData);
            setCourses(courseData);
            setLoading(false);
        };
        fetchData();
    }, [user]);

    const courseMap = useMemo(() => {
        return new Map(courses.map(c => [c.id, c.name]));
    }, [courses]);

    const groupedContent = useMemo(() => {
        const groups = new Map<string, CourseContent[]>();
        content.forEach(item => {
            const courseName = courseMap.get(item.courseId) || 'Unknown Course';
            if (!groups.has(courseName)) {
                groups.set(courseName, []);
            }
            groups.get(courseName)!.push(item);
        });
        return Array.from(groups.entries());
    }, [content, courseMap]);

    const getFileIcon = (fileType: string) => {
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('image')) return '🖼️';
        if (fileType.includes('video')) return '🎬';
        if (fileType.includes('audio')) return '🎵';
        if (fileType.includes('presentation') || fileType.includes('ppt')) return '📊';
        if (fileType.includes('wordprocessingml')) return '📝';
        return '📎';
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Course Content</h1>
            {loading ? <Card><p>Loading content...</p></Card> : (
                <div className="space-y-6">
                    {groupedContent.length > 0 ? groupedContent.map(([courseName, items]) => (
                        <Card key={courseName}>
                            <h2 className="text-xl font-semibold text-text-primary-dark mb-4">{courseName}</h2>
                            <div className="space-y-3">
                                {items.map(item => (
                                    <div key={item.id} className="bg-slate-50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex-grow">
                                            <p className="font-bold text-text-primary-dark">{item.title}</p>
                                            <p className="text-sm text-text-secondary-dark mt-1">{item.description}</p>
                                            <p className="text-xs text-text-secondary-dark mt-2">
                                                <span className="mr-2">{getFileIcon(item.fileType)}</span>
                                                {item.fileName} - Uploaded on {new Date(item.uploadedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 flex items-center gap-2">
                                            {user?.enabledFeatures?.student_ask_ai && <Button onClick={() => setSelectedContentForAI(item)}>Ask AI ✨</Button>}
                                            <a href={item.fileUrl} download={item.fileName} target="_blank" rel="noopener noreferrer">
                                                <Button variant="secondary">Download</Button>
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )) : (
                        <Card><p className="text-center p-8 text-text-secondary-dark">No course content has been uploaded for your subjects yet.</p></Card>
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