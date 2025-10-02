import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
// FIX: Corrected import to use named export
import { TeacherApiService } from "../../services";
const apiService = new TeacherApiService();
import type { Quiz, QuizQuestion, QuizResult } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Input from '../../components/ui/Input.tsx';

const ViewTest: React.FC = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const [quizData, setQuizData] = useState<{ quiz: Quiz; questions: QuizQuestion[]; results: QuizResult[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!quizId) return;
            setLoading(true);
            const data = await apiService.getQuizResults(quizId);
            setQuizData(data);
            setLoading(false);
        };
        fetchData();
    }, [quizId]);

    const filteredResults = useMemo(() => {
        if (!quizData) return [];
        const sortedResults = [...quizData.results].sort((a, b) => (a.score ?? -1) > (b.score ?? -1) ? -1 : 1);
        if (!searchTerm) return sortedResults;
        return sortedResults.filter(r => 
            r.studentName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [quizData, searchTerm]);

    const getScoreColor = (score?: number) => {
        if (score === undefined || score === null) return 'text-text-secondary-dark';
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (loading) return <p>Loading test results...</p>;
    if (!quizData) return <p>Could not find test data.</p>;

    const { quiz, questions, results } = quizData;
    const completedCount = results.filter(r => r.status === 'completed').length;
    const averageScore = completedCount > 0 
        ? results.reduce((acc, r) => acc + (r.score || 0), 0) / completedCount 
        : 0;

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-2">{quiz.title}</h1>
            <p className="text-text-secondary-dark mb-6">Results and questions for this test.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Results Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <h2 className="text-xl font-semibold mb-4">Student Results</h2>
                         <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                            <div className="bg-slate-100 p-3 rounded-lg">
                                <p className="text-2xl font-bold">{completedCount} / {results.length}</p>
                                <p className="text-sm text-text-secondary-dark">Completions</p>
                            </div>
                             <div className="bg-slate-100 p-3 rounded-lg">
                                <p className="text-2xl font-bold">{averageScore.toFixed(1)}%</p>
                                <p className="text-sm text-text-secondary-dark">Average Score</p>
                            </div>
                        </div>
                        <Input 
                            placeholder="Search student..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="mb-4"
                        />
                        <div className="overflow-auto max-h-[60vh]">
                            <table className="w-full text-left">
                                <thead className="border-b border-slate-200 text-sm text-text-secondary-dark sticky top-0 bg-surface-dark">
                                    <tr>
                                        <th className="p-4">Student Name</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Submitted At</th>
                                        <th className="p-4 text-center">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredResults.map(res => (
                                        <tr key={res.studentId} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="p-4 font-medium">{res.studentName}</td>
                                            <td className="p-4">
                                                 <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    res.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm">{res.submittedAt ? new Date(res.submittedAt).toLocaleString() : 'N/A'}</td>
                                            <td className={`p-4 text-center font-bold ${getScoreColor(res.score)}`}>
                                                {res.score !== undefined ? `${res.score}%` : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Questions Column */}
                <div className="lg:col-span-1">
                     <Card>
                        <h2 className="text-xl font-semibold mb-4">Question Bank ({questions.length})</h2>
                        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                            {questions.map((q, index) => (
                                <div key={q.id} className="bg-slate-50 p-3 rounded-lg">
                                    <p className="font-semibold text-sm mb-2">{index + 1}. {q.questionText}</p>
                                    <ul className="list-disc pl-5 text-xs space-y-1">
                                        {q.options.map((opt, oIndex) => (
                                            <li key={oIndex} className={oIndex === q.correctOptionIndex ? 'font-bold text-green-600' : ''}>
                                                {opt}
                                                {oIndex === q.correctOptionIndex && ' (Correct)'}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ViewTest;