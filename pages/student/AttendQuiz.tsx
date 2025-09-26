import React, { useEffect, useState } from 'react';
// FIX: Corrected react-router-dom imports for v6+
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.ts';
// FIX: Corrected import to use named export
import { studentApiService as apiService } from '../../services';
import type { StudentQuiz, Quiz, QuizQuestion } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import { AlertTriangleIcon } from '../../components/icons/Icons.tsx';

const AttendQuiz: React.FC = () => {
    const { studentQuizId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [quizData, setQuizData] = useState<{ studentQuiz: StudentQuiz; quiz: Quiz; questions: QuizQuestion[] } | null>(null);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchQuiz = async () => {
            if (!studentQuizId) return;
            setLoading(true);
            const data = await apiService.getStudentQuizForAttempt(studentQuizId);
            setQuizData(data);
            setLoading(false);
        };
        fetchQuiz();
    }, [studentQuizId]);
    
    // Security measures
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && (e.key === 'c' || e.key === 'u' || e.key === 's')) {
                e.preventDefault();
            }
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                e.preventDefault();
            }
        };
        
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);


    const handleAnswerChange = (questionId: string, optionIndex: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    };

    const handleSubmit = async () => {
        if (!studentQuizId || !quizData) return;

        const allAnswered = quizData.questions.every(q => answers[q.id] !== undefined);
        if (!allAnswered) {
            alert('Please answer all questions before submitting.');
            return;
        }

        setIsSubmitting(true);
        const submission = quizData.questions.map(q => ({
            questionId: q.id,
            selectedOptionIndex: answers[q.id],
        }));
        await apiService.submitStudentQuiz(studentQuizId, submission);
        setIsSubmitting(false);
        alert('Quiz submitted successfully! Your grade will be available in the "My Grades" section if it was auto-graded.');
        navigate('/student/grades');
    };

    if (loading) return <p>Loading quiz...</p>;
    if (!quizData) return <p>Could not load the quiz. It may no longer be available.</p>;
    
    const { quiz, questions } = quizData;

    if (quiz.status === 'paused') {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center">
                <Card>
                    <h1 className="text-2xl font-bold mb-4">{quiz.title}</h1>
                    <p className="text-lg text-text-secondary-dark">This quiz is currently paused by the teacher. Please check back later.</p>
                </Card>
            </div>
        )
    }

    return (
        <div>
            <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-6 flex items-start gap-4">
                <AlertTriangleIcon className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                    <h3 className="font-bold">Academic Integrity Policy</h3>
                    <p className="text-sm">Do not navigate away from this page. Any attempt to switch tabs, copy-paste, or use developer tools will be logged and may result in a score of zero.</p>
                </div>
            </div>

            <Card>
                <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
                <p className="text-text-secondary-dark mb-6">Please answer all {questions.length} questions.</p>

                <div className="space-y-6">
                    {questions.map((q, index) => (
                        <div key={q.id} className="p-4 bg-slate-50 rounded-lg">
                            <p className="font-semibold mb-3">{index + 1}. {q.questionText}</p>
                            <div className="space-y-2">
                                {q.options.map((option, oIndex) => (
                                    <label key={oIndex} className="flex items-center p-3 bg-white rounded-md cursor-pointer hover:bg-slate-100 border">
                                        <input
                                            type="radio"
                                            name={`question-${q.id}`}
                                            checked={answers[q.id] === oIndex}
                                            onChange={() => handleAnswerChange(q.id, oIndex)}
                                            className="w-4 h-4"
                                        />
                                        <span className="ml-3">{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full md:w-1/2"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default AttendQuiz;