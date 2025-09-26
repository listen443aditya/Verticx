import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { registrarApiService as apiService } from '../../services';
import type { Examination, ExamSchedule, SchoolClass, Subject } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import Input from '../../components/ui/Input.tsx';
import ConfirmationModal from '../../components/ui/ConfirmationModal.tsx';

const CreateExaminationModal: React.FC<{
    onClose: () => void;
    onSave: () => void;
}> = ({ onClose, onSave }) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.branchId || !name || !startDate || !endDate) return;
        setIsSaving(true);
        // FIX: Corrected method call to create an examination.
        await apiService.createExamination(user.branchId, { name, startDate, endDate });
        setIsSaving(false);
        onSave();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">Create New Examination</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Examination Name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g., Mid-Term Exams, Fall 2024" />
                    <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                    <Input label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required min={startDate} />
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                        <Button type="submit" disabled={isSaving}>{isSaving ? 'Creating...' : 'Create Examination'}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const ScheduleExamModal: React.FC<{
    examination: Examination;
    classes: SchoolClass[];
    subjects: Subject[];
    onClose: () => void;
    onSave: () => void;
}> = ({ examination, classes, subjects, onClose, onSave }) => {
    const { user } = useAuth();
    const [classId, setClassId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [room, setRoom] = useState('');
    const [totalMarks, setTotalMarks] = useState('100');
    const [isSaving, setIsSaving] = useState(false);

    const availableSubjects = useMemo(() => {
        if (!classId) return [];
        const selectedClass = classes.find(c => c.id === classId);
        if (!selectedClass) return [];
        return subjects.filter(s => selectedClass.subjectIds.includes(s.id));
    }, [classId, classes, subjects]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.branchId) return;
        setIsSaving(true);
        // FIX: Corrected method call to create an exam schedule.
        await apiService.createExamSchedule({
            examinationId: examination.id,
            branchId: user.branchId,
            classId, subjectId, date, startTime, endTime, room,
            totalMarks: Number(totalMarks),
        });
        setIsSaving(false);
        onSave();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">Schedule an Exam</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary-dark mb-1">Class</label>
                            <select value={classId} onChange={e => { setClassId(e.target.value); setSubjectId(''); }} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3" required>
                                <option value="">-- Select Class --</option>
                                {classes.map(c => <option key={c.id} value={c.id}>Grade {c.gradeLevel} - {c.section}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary-dark mb-1">Subject</label>
                            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3" required disabled={!classId}>
                                <option value="">-- Select Subject --</option>
                                {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required min={examination.startDate} max={examination.endDate} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Start Time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                        <Input label="End Time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <Input label="Room / Hall" value={room} onChange={e => setRoom(e.target.value)} required />
                        <Input label="Total Marks" type="number" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                        <Button type="submit" disabled={isSaving}>{isSaving ? 'Schedule Exam' : 'Schedule Exam'}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


const ExaminationManagement: React.FC = () => {
    const [examinations, setExaminations] = useState<Examination[]>([]);
    const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExam, setSelectedExam] = useState<Examination | null>(null);

    const [modal, setModal] = useState<'create_exam' | 'schedule_exam' | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [examData, classData, subjectData] = await Promise.all([
            apiService.getExaminations(apiService.getUserById('VRTX-REG-001')!.branchId!),
            apiService.getSchoolClassesByBranch(apiService.getUserById('VRTX-REG-001')!.branchId!),
            apiService.getSubjectsByBranch(apiService.getUserById('VRTX-REG-001')!.branchId!)
        ]);
        setExaminations(examData);
        setClasses(classData);
        setSubjects(subjectData);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const fetchSchedules = useCallback(async () => {
        if (selectedExam) {
            const scheduleData = await apiService.getExamSchedules(selectedExam.id);
            setSchedules(scheduleData);
        } else {
            setSchedules([]);
        }
    }, [selectedExam]);

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);


    const handleSave = () => {
        setModal(null);
        fetchData();
        if(selectedExam){
            fetchSchedules();
        }
    };
    
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Examination Management</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Examinations</h2>
                        <Button onClick={() => setModal('create_exam')}>New Exam</Button>
                    </div>
                    <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                        {examinations.map(exam => (
                            <div key={exam.id} onClick={() => setSelectedExam(exam)} className={`p-3 rounded-lg cursor-pointer ${selectedExam?.id === exam.id ? 'bg-brand-primary text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>
                                <p className="font-semibold">{exam.name}</p>
                                <p className="text-xs">{exam.startDate} to {exam.endDate}</p>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Exam Schedule</h2>
                        {selectedExam && <Button onClick={() => setModal('schedule_exam')}>Add to Schedule</Button>}
                    </div>
                    {selectedExam ? (
                         <div className="overflow-x-auto max-h-[70vh]">
                            <table className="w-full text-left">
                                <thead className="border-b">
                                    <tr>
                                        <th className="p-2">Date</th>
                                        <th className="p-2">Time</th>
                                        <th className="p-2">Class</th>
                                        <th className="p-2">Subject</th>
                                        <th className="p-2">Room</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedules.map(s => (
                                        <tr key={s.id} className="border-b">
                                            <td className="p-2">{s.date}</td>
                                            <td className="p-2">{s.startTime} - {s.endTime}</td>
                                            <td className="p-2">{classes.find(c=>c.id === s.classId)?.section}</td>
                                            <td className="p-2">{subjects.find(sub=>sub.id === s.subjectId)?.name}</td>
                                            <td className="p-2">{s.room}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p className="text-center text-slate-500 p-8">Select an examination to view its schedule.</p>}
                </Card>
            </div>

            {modal === 'create_exam' && <CreateExaminationModal onClose={() => setModal(null)} onSave={handleSave} />}
            {modal === 'schedule_exam' && selectedExam && <ScheduleExamModal examination={selectedExam} classes={classes} subjects={subjects} onClose={() => setModal(null)} onSave={handleSave} />}
        </div>
    );
};

// FIX: Added default export
export default ExaminationManagement;