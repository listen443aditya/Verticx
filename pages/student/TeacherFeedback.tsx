


import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
// FIX: Corrected import to use named export
import { StudentApiService } from '../../services';
import type { Teacher, TeacherFeedback } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';

const apiService = new StudentApiService();
const FEEDBACK_PARAMS = [
    'Clarity of Explanation',
    'Subject Knowledge',
    'Engagement & Interaction',
    'Punctuality & Regularity',
    'Helpfulness & Support'
];

const ComplaintModal: React.FC<{ teacher: Teacher; onClose: () => void; onSubmit: () => void; }> = ({ teacher, onClose, onSubmit }) => {
    const { user } = useAuth();
    const [complaintText, setComplaintText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!complaintText.trim() || !user) return;
        setIsSubmitting(true);
        try {
            await apiService.submitTeacherComplaint({
                studentId: user.id,
                teacherId: teacher.id,
                subject: 'General Complaint',
                complaintText,
                status: 'Open',
            });
            onSubmit();
        } catch (error) {
            console.error("Failed to submit complaint:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <h2 className="text-xl font-bold text-text-primary-dark mb-2">Raise a Complaint Against {teacher.name}</h2>
                <p className="text-sm text-text-secondary-dark mb-4">This complaint will be sent confidentially to the principal for review. Please be specific and respectful.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-text-secondary-dark mb-1">Your Complaint</label>
                        <textarea
                            value={complaintText}
                            onChange={e => setComplaintText(e.target.value)}
                            rows={6}
                            className="w-full bg-white border border-slate-300 rounded-md py-2 px-3"
                            required
                        />
                    </div>
                     <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" variant="danger" disabled={isSubmitting || !complaintText.trim()}>
                            {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


const StarRating: React.FC<{ rating: number; onRating: (rating: number) => void; disabled?: boolean; }> = ({ rating, onRating, disabled }) => {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex">
            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                    <button
                        type="button"
                        key={ratingValue}
                        className={`text-3xl ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        onClick={() => !disabled && onRating(ratingValue)}
                        onMouseEnter={() => !disabled && setHover(ratingValue)}
                        onMouseLeave={() => !disabled && setHover(0)}
                    >
                        <span className={ratingValue <= (hover || rating) ? "text-yellow-400" : "text-slate-300"}>&#9733;</span>
                    </button>
                );
            })}
        </div>
    );
};

const TeacherFeedback: React.FC = () => {
    const { user } = useAuth();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [feedbackHistory, setFeedbackHistory] = useState<TeacherFeedback[]>([]);
    const [ratings, setRatings] = useState<Record<string, Record<string, number>>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
    const [submitStatus, setSubmitStatus] = useState('');
    const [complainingAgainst, setComplainingAgainst] = useState<Teacher | null>(null);

    const fetchData = useCallback(async () => {
        if (!user?.branchId) return;
        setLoading(true);
        const [teacherData, historyData] = await Promise.all([
            apiService.getTeachersByBranch(user.branchId),
            apiService.getStudentFeedbackHistory(user.id)
        ]);
        setTeachers(teacherData);
        setFeedbackHistory(historyData);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRatingChange = (teacherId: string, param: string, rating: number) => {
        setRatings(prev => ({
            ...prev,
            [teacherId]: {
                ...prev[teacherId],
                [param]: rating
            }
        }));
    };

    const handleSubmit = async (teacherId: string) => {
        if (!user) return;
        const teacherRatings = ratings[teacherId];
        if (!teacherRatings || Object.keys(teacherRatings).length < FEEDBACK_PARAMS.length) {
            alert('Please rate all parameters before submitting.');
            return;
        }
        setSubmitting(prev => ({ ...prev, [teacherId]: true }));
        try {
            await apiService.submitTeacherFeedback({
                studentId: user.id,
                teacherId,
                parameters: teacherRatings
            });
            setSubmitStatus(`Feedback submitted for ${teachers.find(t=>t.id===teacherId)?.name}. Thank you!`);
            fetchData(); // Refresh history
        } catch (error) {
            console.error(error);
            setSubmitStatus('Failed to submit feedback. Please try again.');
        } finally {
            setSubmitting(prev => ({ ...prev, [teacherId]: false }));
            setTimeout(() => setSubmitStatus(''), 5000);
        }
    };

    const handleComplaintSubmit = () => {
        setSubmitStatus(`Your confidential complaint has been submitted to the principal.`);
        setComplainingAgainst(null);
        setTimeout(() => setSubmitStatus(''), 5000);
    };
    
    const getSubmittedFeedback = (teacherId: string) => feedbackHistory.find(f => f.teacherId === teacherId);

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Teacher Feedback</h1>
            <Card>
                <p className="mb-6 text-text-secondary-dark">Your honest feedback helps us improve the quality of education. Please rate your teachers on a scale of 1 to 5 stars. You can also raise a confidential complaint if necessary.</p>
                {submitStatus && <p className="text-center text-green-600 mb-4">{submitStatus}</p>}
                {loading ? <p>Loading teachers...</p> : (
                    <div className="space-y-6">
                        {teachers.length === 0 && <p className="text-center text-text-secondary-dark p-8">No teachers found in this school.</p>}
                        {teachers.map(teacher => {
                            const submittedFeedback = getSubmittedFeedback(teacher.id);
                            return (
                                <div key={teacher.id} className="p-4 bg-slate-50 rounded-lg">
                                    <h2 className="text-xl font-semibold text-text-primary-dark mb-4">{teacher.name}</h2>
                                    <div className="space-y-3">
                                        {FEEDBACK_PARAMS.map(param => (
                                            <div key={param} className="flex flex-col sm:flex-row justify-between sm:items-center">
                                                <p className="font-medium">{param}</p>
                                                <StarRating
                                                    rating={submittedFeedback ? submittedFeedback.parameters[param] : (ratings[teacher.id]?.[param] || 0)}
                                                    onRating={(rating) => handleRatingChange(teacher.id, param, rating)}
                                                    disabled={!!submittedFeedback}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t flex justify-end items-center gap-4">
                                         <Button
                                            variant="danger"
                                            className="!px-3 !py-1 text-sm"
                                            onClick={() => setComplainingAgainst(teacher)}
                                        >
                                            Raise a Complaint
                                        </Button>
                                        {submittedFeedback ? (
                                            <p className="text-sm font-semibold text-green-600">Feedback submitted on {new Date(submittedFeedback.feedbackDate).toLocaleDateString()}</p>
                                        ) : (
                                            <Button
                                                onClick={() => handleSubmit(teacher.id)}
                                                disabled={submitting[teacher.id]}
                                            >
                                                {submitting[teacher.id] ? 'Submitting...' : 'Submit Feedback'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
            {complainingAgainst && (
                <ComplaintModal
                    teacher={complainingAgainst}
                    onClose={() => setComplainingAgainst(null)}
                    onSubmit={handleComplaintSubmit}
                />
            )}
        </div>
    );
};

export default TeacherFeedback;