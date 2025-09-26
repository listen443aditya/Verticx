import React, { useState } from 'react';
import type { PrincipalDashboardData } from '../../types.ts';
import Card from '../ui/Card.tsx';
import Input from '../ui/Input.tsx';
import Button from '../ui/Button.tsx';
import { geminiService } from '../../services/geminiService.ts';

interface AIAssistantCardProps {
    data: PrincipalDashboardData;
}

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

const AIAssistantCard: React.FC<AIAssistantCardProps> = ({ data }) => {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: "Hello Principal! I'm your AI Assistant. Ask me anything about your school's data." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const constructPrompt = (question: string) => {
        const { summary, classPerformance, teacherPerformance, topStudents, syllabusProgress, pendingStaffRequests, collectionsByGrade } = data;

        // Simplified data representation for the prompt
        const context = `
        You are an AI assistant for a school principal. Your goal is to answer questions based on the following data for the school. Be concise and helpful.

        **School Summary:**
        - Total Students: ${summary.totalStudents}
        - Total Teachers: ${summary.totalTeachers}
        - Total Classes: ${summary.totalClasses}
        - Fees Collected (This Month): ${summary.feesCollected.toLocaleString()}
        - Fees Pending (This Month): ${summary.feesPending.toLocaleString()}

        **Academic Performance:**
        - Class Performance (Average Score %): ${classPerformance.map(c => `${c.name}: ${c.performance.toFixed(1)}%`).join(', ')}
        - Top 5 Teachers (Performance Index): ${teacherPerformance.map(t => `${t.teacherName}: ${t.performanceIndex.toFixed(1)}/100`).join(', ')}
        - Top 5 Students (School Rank): ${topStudents.map(s => `${s.studentName} (Rank ${s.rank} in ${s.className})`).join(', ')}
        - Syllabus Progress (%): ${syllabusProgress.map(s => `${s.name}: ${s.progress.toFixed(1)}%`).join(', ')}

        **Administrative Data:**
        - Pending Staff Requests: Leave(${pendingStaffRequests.leave}), Attendance Changes(${pendingStaffRequests.attendance}), Fee Template Changes(${pendingStaffRequests.fees})
        - Fee Collections by Grade: ${collectionsByGrade.map(g => `${g.name}: ${g.collected.toLocaleString()} collected, ${g.due.toLocaleString()} due`).join('; ')}
        `;
        
        return `${context}\n\n**Principal's Question:**\n${question}`;
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const prompt = constructPrompt(input);
        const aiResponseText = await geminiService.generateResponse(prompt);
        
        const aiMessage: Message = { sender: 'ai', text: aiResponseText };
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
    };

    return (
        <Card>
            <h2 className="text-xl font-semibold text-text-primary-dark mb-4">Principal's AI Assistant ✨</h2>
            <div className="h-64 overflow-y-auto mb-4 p-2 bg-slate-50 rounded-lg space-y-3">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-sm rounded-lg px-3 py-2 ${msg.sender === 'user' ? 'bg-brand-primary text-white' : 'bg-slate-200 text-text-primary-dark'}`}>
                            <p className="text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex justify-start">
                         <div className="max-w-xs md:max-w-sm rounded-lg px-3 py-2 bg-slate-200 text-text-primary-dark">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                <Input 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about your school..."
                    className="flex-grow"
                    disabled={isLoading}
                />
                <Button onClick={handleSend} disabled={isLoading}>Send</Button>
            </div>
        </Card>
    );
};

export default AIAssistantCard;