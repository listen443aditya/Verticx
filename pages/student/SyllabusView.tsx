import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
// FIX: Corrected import to use named export
import { StudentApiService } from '../../services';
import type { Lecture } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import { ClipboardListIcon } from '../../components/icons/Icons.tsx';

const apiService = new StudentApiService();
interface LecturePlan {
    subjectName: string;
    lectures: Lecture[];
}

const SyllabusView: React.FC = () => {
    const { user } = useAuth();
    const [lecturePlans, setLecturePlans] = useState<LecturePlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'official' | 'self_study'>('official');
    const [completedLectureIds, setCompletedLectureIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            const [lectureData, completedIds] = await Promise.all([
                apiService.getLecturesForStudent(),
                apiService.getStudentSelfStudyProgress()
            ]);
            setLecturePlans(lectureData);
            setCompletedLectureIds(new Set(completedIds));
            setLoading(false);
        };
        fetchData();
    }, [user]);
    
    const handleSelfStudyToggle = async (lectureId: string, isCompleted: boolean) => {
        if (!user) return;
        
        // Optimistic UI update for better UX
        const newSet = new Set(completedLectureIds);
        if (isCompleted) {
            newSet.add(lectureId);
        } else {
            newSet.delete(lectureId);
        }
        setCompletedLectureIds(newSet);
    
        // API call
        await apiService.updateStudentSelfStudyProgress(user.id, lectureId, isCompleted);
    };

    const getStatus = (lecture: Lecture): { text: string; color: string } => {
        if (lecture.status === 'completed') return { text: 'Completed', color: 'bg-green-100 text-green-800' };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const scheduledDate = new Date(lecture.scheduledDate);
        
        if (scheduledDate < today) return { text: 'Completed (Late)', color: 'bg-red-100 text-red-800' };
        
        return { text: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    };

    const tabButtonClasses = (isActive: boolean) =>
        `px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${isActive ? 'bg-slate-200 rounded-t-lg font-semibold' : 'text-text-secondary-dark hover:bg-slate-100'}`;

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Syllabus & Lecture Plan</h1>
            <Card>
                <div className="flex border-b border-slate-200 mb-6">
                    <button className={tabButtonClasses(activeTab === 'official')} onClick={() => setActiveTab('official')}>Official Syllabus</button>
                    <button className={tabButtonClasses(activeTab === 'self_study')} onClick={() => setActiveTab('self_study')}>My Study Progress</button>
                </div>

                {loading ? <p>Loading syllabus...</p> : lecturePlans.length === 0 ? (
                    <div className="text-center py-8">
                        <ClipboardListIcon className="w-12 h-12 mx-auto text-slate-300" />
                        <p className="mt-4 text-text-secondary-dark">Your teachers have not published a syllabus yet.</p>
                        <p className="text-sm text-text-secondary-dark">Please check back later.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {lecturePlans.map(plan => (
                            <div key={plan.subjectName}>
                                <h2 className="text-xl font-semibold text-text-primary-dark mb-4">{plan.subjectName}</h2>
                                <div className="space-y-2">
                                    {plan.lectures.length > 0 ? plan.lectures.map((lecture, index) => {
                                        if (activeTab === 'official') {
                                            const status = getStatus(lecture);
                                            return (
                                                <div key={lecture.id} className="grid grid-cols-12 gap-4 items-center bg-slate-50 p-3 rounded-lg text-sm">
                                                    <div className="col-span-12 md:col-span-8 font-medium">
                                                        {index + 1}. {lecture.topic}
                                                    </div>
                                                    <div className="col-span-6 md:col-span-2">
                                                        {new Date(lecture.scheduledDate).toLocaleDateString()}
                                                    </div>
                                                    <div className="col-span-6 md:col-span-2 text-center">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>{status.text}</span>
                                                    </div>
                                                </div>
                                            );
                                        } else { // self_study tab
                                             return (
                                                <div key={lecture.id} className="grid grid-cols-12 gap-4 items-center bg-slate-50 p-3 rounded-lg text-sm">
                                                    <div className="col-span-1 flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            className="h-5 w-5 rounded border-gray-300 text-brand-secondary focus:ring-brand-accent"
                                                            checked={completedLectureIds.has(lecture.id)}
                                                            onChange={(e) => handleSelfStudyToggle(lecture.id, e.target.checked)}
                                                        />
                                                    </div>
                                                    <div className="col-span-11 md:col-span-7 font-medium">
                                                        {lecture.topic}
                                                    </div>
                                                    <div className="col-span-12 md:col-span-4 text-left md:text-right text-xs text-text-secondary-dark">
                                                        Scheduled for: {new Date(lecture.scheduledDate).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    }) : <p className="text-sm text-text-secondary-dark">No lectures planned for this subject yet.</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default SyllabusView;