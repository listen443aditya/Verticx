import React, { useEffect, useState, useCallback } from 'react';
// FIX: Corrected react-router-dom import for v6+
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.ts';
// FIX: Corrected import to use named export
import { StudentApiService} from '../../services';
import type { StudentQuiz } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import { AcademicsIcon } from '../../components/icons/Icons.tsx';

const apiService = new StudentApiService();


const QuizList: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState<(StudentQuiz & { quizTitle: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuizzes = async () => {
            if (!user) return;
            setLoading(true);
            const data = await apiService.getAvailableQuizzesForStudent();
            setQuizzes(data);
            setLoading(false);
        };
        fetchQuizzes();
    }, [user]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Available Quizzes</h1>
            <Card>
                {loading ? (
                    <p>Loading quizzes...</p>
                ) : quizzes.length === 0 ? (
                    <p className="text-center text-text-secondary-dark p-8">No quizzes are currently available for you to take.</p>
                ) : (
                    <div className="space-y-4">
                        {quizzes.map(quiz => (
                            <div key={quiz.id} className="bg-slate-50 p-4 rounded-lg flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <AcademicsIcon className="w-6 h-6 text-brand-secondary" />
                                    <h2 className="text-lg font-semibold">{quiz.quizTitle}</h2>
                                </div>
                                <Button onClick={() => navigate(`/student/quiz/${quiz.id}`)}>Start Quiz</Button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default QuizList;