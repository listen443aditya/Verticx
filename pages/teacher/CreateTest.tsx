import React, { useEffect, useState, useCallback } from 'react';
// FIX: Corrected react-router-dom imports for v6+
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.ts';
// FIX: Corrected import to use named export
import { teacherApiService as apiService } from '../../services';
import type { Quiz, QuizQuestion, SchoolClass } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import Input from '../../components/ui/Input.tsx';
import { HelpCircleIcon } from '../../components/icons/Icons.tsx';

const CreateTest: React.FC = () => {
    const { quizId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState<Partial<Quiz>>({ title: '', classId: '', questionsPerStudent: 10, status: 'draft' });
    const [questions, setQuestions] = useState<Partial<QuizQuestion>[]>([{ questionText: '', options: ['', ''], correctOptionIndex: 0 }]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.branchId) return;
            setLoading(true);
            const classesData = await apiService.getSchoolClassesByBranch(user.branchId);
            setClasses(classesData);

            if (quizId && quizId !== 'new') {
                const quizData = await apiService.getQuizWithQuestions(quizId);
                if (quizData) {
                    setQuiz(quizData.quiz);
                    setQuestions(quizData.questions.length > 0 ? quizData.questions : [{ questionText: '', options: ['', ''], correctOptionIndex: 0 }]);
                }
            }
            setLoading(false);
        };
        fetchData();
    }, [quizId, user]);

    const handleQuizChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setQuiz(prev => ({ ...prev, [name]: name === 'questionsPerStudent' ? Number(value) : value }));
    };

    const handleQuestionChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuestions = [...questions];
        newQuestions[index].questionText = e.target.value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex: number, oIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options![oIndex] = e.target.value;
        setQuestions(newQuestions);
    };

    const handleCorrectOptionChange = (qIndex: number, oIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].correctOptionIndex = oIndex;
        setQuestions(newQuestions);
    };

    const addQuestion = () => {
        setQuestions([...questions, { questionText: '', options: ['', ''], correctOptionIndex: 0 }]);
    };
    
    const removeQuestion = (index: number) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };
    
    const addOption = (qIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options!.push('');
        setQuestions(newQuestions);
    };
    
    const removeOption = (qIndex: number, oIndex: number) => {
        const newQuestions = [...questions];
        if (newQuestions[qIndex].options!.length > 2) {
             newQuestions[qIndex].options!.splice(oIndex, 1);
             // If we removed the correct answer, reset it to the first option
             if(newQuestions[qIndex].correctOptionIndex === oIndex) {
                 newQuestions[qIndex].correctOptionIndex = 0;
             }
             setQuestions(newQuestions);
        }
    };

    const handleSave = async (status: 'draft' | 'published') => {
        if (!user) return;
        setIsSaving(true);
        const quizData = {
            ...quiz,
            status,
            teacherId: user.id,
            branchId: user.branchId,
        };
        await apiService.saveQuiz(quizData, questions);
        setIsSaving(false);
        navigate('/teacher/quizzes');
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">{quizId === 'new' ? 'Create New Quiz' : 'Edit Quiz'}</h1>
            <div className="space-y-6">
                <Card>
                    <h2 className="text-xl font-semibold mb-4">Quiz Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Quiz Title" name="title" value={quiz.title} onChange={handleQuizChange} required />
                        <div>
                             <label className="block text-sm font-medium text-text-secondary-dark mb-1">Assign to Class</label>
                             <select name="classId" value={quiz.classId} onChange={handleQuizChange} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3" required>
                                <option value="">-- Select Class --</option>
                                {classes.map(c => <option key={c.id} value={c.id}>Grade {c.gradeLevel} - {c.section}</option>)}
                            </select>
                        </div>
                        <Input label="Questions per Student" name="questionsPerStudent" type="number" value={quiz.questionsPerStudent} onChange={handleQuizChange} required min="1" />
                    </div>
                </Card>

                {questions.map((q, qIndex) => (
                    <Card key={qIndex}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2"><HelpCircleIcon /> Question {qIndex + 1}</h3>
                            <Button variant="danger" className="!px-2 !py-1 text-xs" onClick={() => removeQuestion(qIndex)} disabled={questions.length <= 1}>Remove</Button>
                        </div>
                        <Input label="Question Text" value={q.questionText} onChange={(e) => handleQuestionChange(qIndex, e)} required />
                        <div className="mt-4 space-y-2">
                             <label className="block text-sm font-medium text-text-secondary-dark">Options (select correct answer)</label>
                             {q.options?.map((opt, oIndex) => (
                                 <div key={oIndex} className="flex items-center gap-2">
                                     <input type="radio" name={`correct-opt-${qIndex}`} checked={q.correctOptionIndex === oIndex} onChange={() => handleCorrectOptionChange(qIndex, oIndex)} className="w-4 h-4" />
                                     <Input className="flex-grow" value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e)} required placeholder={`Option ${oIndex + 1}`} />
                                     <Button variant="danger" className="!px-2 !py-1 text-xs" onClick={() => removeOption(qIndex, oIndex)} disabled={q.options!.length <= 2}>X</Button>
                                 </div>
                             ))}
                             <Button variant="secondary" className="!px-3 !py-1 text-xs mt-2" onClick={() => addOption(qIndex)}>Add Option</Button>
                        </div>
                    </Card>
                ))}
                
                <div className="flex justify-between items-center">
                    <Button variant="secondary" onClick={addQuestion}>Add Another Question</Button>
                    <div className="flex gap-4">
                        <Button variant="secondary" onClick={() => handleSave('draft')} disabled={isSaving}>Save as Draft</Button>
                        <Button variant="primary" onClick={() => handleSave('published')} disabled={isSaving}>Publish Quiz</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateTest;