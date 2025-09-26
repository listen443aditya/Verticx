import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
// FIX: Corrected import to use named export
import { teacherApiService as apiService } from '../../services';
import type { SchoolClass, Subject, Lecture, SyllabusChangeRequest } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import Input from '../../components/ui/Input.tsx';
import { ClipboardListIcon } from '../../components/icons/Icons.tsx';
import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';

interface TeacherCourse {
    id: string; // e.g., 'classId|subjectId'
    classId: string;
    subjectId: string;
    name: string;
}

const SyllabusChangeRequestModal: React.FC<{
    lecture: Partial<Lecture>;
    requestType: 'update' | 'delete';
    onClose: () => void;
    onSubmit: () => void;
}> = ({ lecture, requestType, onClose, onSubmit }) => {
    const { user } = useAuth();
    const [reason, setReason] = useState('');
    const [updatedLecture, setUpdatedLecture] = useState({ ...lecture });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const tomorrow = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason || !user || !lecture.id) return;
        setIsSubmitting(true);
        
        const requestData = {
            branchId: user.branchId!,
            teacherId: user.id,
            classId: lecture.classId!,
            subjectId: lecture.subjectId!,
            requestType: requestType,
            lectureId: lecture.id,
            originalData: JSON.stringify(lecture),
            newData: requestType === 'update' ? JSON.stringify(updatedLecture) : undefined,
            reason
        };

        await apiService.submitSyllabusChangeRequest(requestData as any);
        setIsSubmitting(false);
        onSubmit();
    };

    const handleFieldChange = (field: 'topic' | 'scheduledDate', value: string) => {
        setUpdatedLecture(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <h2 className="text-xl font-bold text-text-primary-dark mb-4">Request Syllabus Change</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {requestType === 'update' && (
                        <div className="space-y-4 p-4 bg-slate-100 rounded-lg">
                            <h3 className="font-semibold">Proposed Changes:</h3>
                            <Input label="Topic" value={updatedLecture.topic} onChange={e => handleFieldChange('topic', e.target.value)} />
                            <Input label="Scheduled Date" type="date" min={tomorrow} value={updatedLecture.scheduledDate} onChange={e => handleFieldChange('scheduledDate', e.target.value)} />
                        </div>
                    )}
                     {requestType === 'delete' && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p>You are requesting to delete the following lecture:</p>
                            <p className="font-semibold mt-2">"{lecture.topic}" scheduled for {lecture.scheduledDate}</p>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-dark mb-1">Reason for Change</label>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3" required />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting || !reason}>
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const SyllabusManagement: React.FC = () => {
    const { user } = useAuth();
    const { refreshKey, triggerRefresh } = useDataRefresh();
    const [teacherCourses, setTeacherCourses] = useState<TeacherCourse[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [lectures, setLectures] = useState<Partial<Lecture>[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [changeRequest, setChangeRequest] = useState<{ lecture: Partial<Lecture>, type: 'update' | 'delete' } | null>(null);
    const [statusMessage, setStatusMessage] = useState('');

    const tomorrow = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    }, []);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
// FIX: Called the correct 'getTeacherCourses' method on apiService.
        const courses = await apiService.getTeacherCourses(user.id);
        setTeacherCourses(courses);
        if (courses.length > 0) {
            setSelectedCourseId(courses[0].id);
        } else {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const fetchLectures = useCallback(async () => {
        if (!selectedCourseId) {
            setLectures([]);
            return;
        }
        setLoading(true);
        const [classId, subjectId] = selectedCourseId.split('|');
// FIX: Called the correct 'getLectures' method on apiService.
        const lectureData = await apiService.getLectures(classId, subjectId);
        setLectures(lectureData);
        setLoading(false);
    }, [selectedCourseId, refreshKey]);

    useEffect(() => {
        fetchLectures();
    }, [fetchLectures]);

    const handleLectureChange = (index: number, field: 'topic' | 'scheduledDate', value: string) => {
        const newLectures = [...lectures];
        newLectures[index] = { ...newLectures[index], [field]: value };
        setLectures(newLectures);
    };

    const addLecture = () => {
        setLectures([...lectures, { topic: '', scheduledDate: tomorrow, status: 'pending' }]);
    };

    const removeLecture = (index: number) => {
        setLectures(lectures.filter((_, i) => i !== index));
    };

    const handleSaveChanges = async () => {
        const newLectures = lectures.filter(l => !l.id);
        if (newLectures.length === 0) {
            setStatusMessage("No new lectures to save.");
            setTimeout(() => setStatusMessage(''), 3000);
            return;
        }
        if (!selectedCourseId || !user) return;
        
        setIsSaving(true);
        const [classId, subjectId] = selectedCourseId.split('|');
        await apiService.saveLectures(classId, subjectId, user.id, user.branchId!, newLectures);
        setIsSaving(false);
        setStatusMessage("New lectures saved successfully!");
        triggerRefresh();
        setTimeout(() => setStatusMessage(''), 3000);
    };
    
    const handleMarkAsDone = async (lectureId: string) => {
        setIsSaving(true);
        await apiService.updateLectureStatus(lectureId, 'completed');
        triggerRefresh();
        setIsSaving(false);
    };

    const handleSubmitRequest = () => {
        setChangeRequest(null);
        setStatusMessage('Your change request has been submitted for approval.');
        triggerRefresh();
        setTimeout(() => setStatusMessage(''), 5000);
    };

    const getStatus = (lecture: Partial<Lecture>): { text: string; color: string } => {
        if (lecture.status === 'completed') return { text: 'Completed', color: 'bg-green-100 text-green-800' };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const scheduledDate = new Date(lecture.scheduledDate!);
        
        if (scheduledDate < today) return { text: 'Late', color: 'bg-red-100 text-red-800' };
        
        return { text: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Syllabus & Lecture Plan</h1>
            <Card>
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <div>
                        <label htmlFor="course-select" className="block text-sm font-medium text-text-secondary-dark mb-1">Select Course</label>
                        <select id="course-select" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="bg-surface-dark border border-slate-300 rounded-md py-2 px-3">
                            {teacherCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    {selectedCourseId && <Button onClick={addLecture}>Add New Lecture</Button>}
                </div>

                {statusMessage && <p className="text-center text-green-600 mb-4">{statusMessage}</p>}

                {loading ? <p>Loading plan...</p> : (lectures.length === 0 && teacherCourses.length > 0) ? (
                    <div className="text-center py-8">
                        <ClipboardListIcon className="w-12 h-12 mx-auto text-slate-300" />
                        <p className="mt-4 text-text-secondary-dark">No lecture plan created for this course yet.</p>
                        <p className="text-sm text-text-secondary-dark">Click "Add New Lecture" to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {lectures.map((lecture, index) => {
                            const isSaved = !!lecture.id;
                            const status = isSaved ? getStatus(lecture) : { text: 'New', color: 'bg-purple-100 text-purple-800' };
                            return (
                                <div key={lecture.id || `new-${index}`} className="grid grid-cols-12 gap-4 items-center bg-slate-50 p-3 rounded-lg">
                                    <div className="col-span-12 md:col-span-5">
                                        <Input label={`Topic ${index + 1}`} value={lecture.topic} onChange={e => handleLectureChange(index, 'topic', e.target.value)} readOnly={isSaved} className={isSaved ? 'bg-slate-200 cursor-not-allowed' : ''}/>
                                    </div>
                                    <div className="col-span-6 md:col-span-2">
                                        <Input type="date" label="Date" value={lecture.scheduledDate} min={tomorrow} onChange={e => handleLectureChange(index, 'scheduledDate', e.target.value)} readOnly={isSaved} className={isSaved ? 'bg-slate-200 cursor-not-allowed' : ''} />
                                    </div>
                                    <div className="col-span-6 md:col-span-1 text-center">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>{status.text}</span>
                                    </div>
                                    <div className="col-span-12 md:col-span-4 flex justify-end gap-2 flex-wrap">
                                        {isSaved ? (
                                            <>
                                                {lecture.status !== 'completed' && <Button variant="secondary" className="!px-2 !py-1 text-xs" onClick={() => handleMarkAsDone(lecture.id!)} disabled={isSaving}>Mark Done</Button>}
                                                <Button variant="secondary" className="!px-2 !py-1 text-xs" onClick={() => setChangeRequest({ lecture, type: 'update' })}>Request Edit</Button>
                                                <Button variant="danger" className="!px-2 !py-1 text-xs" onClick={() => setChangeRequest({ lecture, type: 'delete' })}>Request Delete</Button>
                                            </>
                                        ) : (
                                            <Button variant="danger" className="!px-2 !py-1 text-xs" onClick={() => removeLecture(index)}>Remove</Button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
                {lectures.some(l => !l.id) &&
                    <div className="mt-6 text-right border-t pt-4">
                        <Button onClick={handleSaveChanges} disabled={isSaving}>{isSaving ? 'Saving New Lectures...' : 'Save New Lectures'}</Button>
                    </div>
                }
            </Card>
            {changeRequest && (
                <SyllabusChangeRequestModal
                    lecture={changeRequest.lecture}
                    requestType={changeRequest.type}
                    onClose={() => setChangeRequest(null)}
                    onSubmit={handleSubmitRequest}
                />
            )}
        </div>
    );
};

export default SyllabusManagement;