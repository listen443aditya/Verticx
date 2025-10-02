import React, { useEffect, useState, useCallback } from 'react';
// FIX: Corrected react-router-dom import for v6+
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.ts';
// FIX: Corrected import to use named export
import { TeacherApiService } from "../../services";
const apiService = new TeacherApiService();
import type { Quiz } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';

const MyQuizzes: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchQuizzes = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const data = await apiService.getQuizzesForTeacher(user.id);
        setQuizzes(data);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchQuizzes();
    }, [fetchQuizzes]);

    const handleQuizAction = async (quizId: string, status: 'published' | 'paused') => {
        setActionLoading(true);
        await apiService.updateQuizStatus(quizId, status);
        await fetchQuizzes();
        setActionLoading(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-text-primary-dark">My Quizzes</h1>
                <Button onClick={() => navigate('/teacher/create-test/new')}>Create New Quiz</Button>
            </div>
            <Card>
                {loading ? (
                    <p>Loading quizzes...</p>
                ) : quizzes.length === 0 ? (
                    <p className="text-center text-text-secondary-dark p-8">You haven't created any quizzes yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-slate-200 text-sm text-text-secondary-dark">
                                <tr>
                                    <th className="p-4">Title</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Created At</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quizzes.map(quiz => (
                                    <tr key={quiz.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-4 font-medium">{quiz.title}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                quiz.status === 'published' ? 'bg-green-100 text-green-800' :
                                                quiz.status === 'paused' ? 'bg-orange-100 text-orange-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="p-4">{new Date(quiz.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {quiz.status === 'draft' && (
                                                    <Button 
                                                        variant="secondary" 
                                                        className="!px-3 !py-1 text-xs"
                                                        onClick={() => navigate(`/teacher/create-test/${quiz.id}`)}
                                                        disabled={actionLoading}
                                                    >
                                                        Edit
                                                    </Button>
                                                )}
                                                {quiz.status === 'published' && (
                                                    <>
                                                        <Button variant="secondary" className="!px-3 !py-1 text-xs" onClick={() => handleQuizAction(quiz.id, 'paused')} disabled={actionLoading}>Pause</Button>
                                                        <Button variant="secondary" className="!px-3 !py-1 text-xs" onClick={() => navigate(`/teacher/view-test/${quiz.id}`)} disabled={actionLoading}>View</Button>
                                                    </>
                                                )}
                                                {quiz.status === 'paused' && (
                                                    <>
                                                        <Button variant="primary" className="!px-3 !py-1 text-xs" onClick={() => handleQuizAction(quiz.id, 'published')} disabled={actionLoading}>Resume</Button>
                                                        <Button variant="secondary" className="!px-3 !py-1 text-xs" onClick={() => navigate(`/teacher/view-test/${quiz.id}`)} disabled={actionLoading}>View</Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default MyQuizzes;