import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
// FIX: Corrected import to use teacherApiService aliased as apiService.
import { teacherApiService as apiService } from '../../services';
// FIX: Added missing 'AttendanceRecord' type to the import.
import type { TeacherCourse, Student, AttendanceStatus, SchoolEvent, AttendanceRecord } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import Input from '../../components/ui/Input.tsx';
import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';

const RequestChangeModal: React.FC<{
    student: { id: string, name: string },
    course: { id: string, name: string },
    date: string,
    currentStatus: AttendanceStatus,
    onClose: () => void,
    onSubmit: () => void
}> = ({ student, course, date, currentStatus, onClose, onSubmit }) => {
    const { user } = useAuth();
    const [newStatus, setNewStatus] = useState<AttendanceStatus>(currentStatus);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason || newStatus === currentStatus || !user) return;
        setIsSubmitting(true);

        const requestData = {
            branchId: user.branchId!,
            teacherId: user.id,
            type: 'Attendance' as const,
            details: {
                studentId: student.id,
                studentName: student.name,
                courseId: course.id,
                courseName: course.name,
                date: date,
                from: currentStatus,
                to: newStatus,
            },
            reason: reason + " (Note: This change request is for the student's daily attendance status.)",
        };
// FIX: Corrected method call to `submitRectificationRequest`. This is a more general-purpose method for submitting change requests, which is appropriate for attendance changes.
        await apiService.submitRectificationRequest(requestData as any);
        setIsSubmitting(false);
        onSubmit();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <h2 className="text-xl font-bold text-text-primary-dark mb-4">Request Daily Attendance Change</h2>
                <p className="text-sm text-text-secondary-dark mb-4">For: <strong>{student.name}</strong> on {date}</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">From</label>
                            <p className="mt-1 p-2 bg-slate-200 rounded">{currentStatus}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">To</label>
                            <select value={newStatus} onChange={e => setNewStatus(e.target.value as AttendanceStatus)} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3">
                                <option>Present</option>
                                <option>Absent</option>
                                <option>Tardy</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Reason for Change</label>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3" required/>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting || !reason || newStatus === currentStatus}>
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


const AttendanceManagement: React.FC = () => {
    const { user } = useAuth();
    const { refreshKey, triggerRefresh } = useDataRefresh();
    const [courses, setCourses] = useState<TeacherCourse[]>([]);
    const [holidays, setHolidays] = useState<Set<string>>(new Set());
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
    const [isSaved, setIsSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    // Modal states
    const [requestChangeFor, setRequestChangeFor] = useState<Student | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user?.branchId) return;
            setLoading(true);
// FIX: Called the correct 'getTeacherCourses' and 'getSchoolEvents' methods on apiService.
            const [coursesData, eventsData] = await Promise.all([
                apiService.getTeacherCourses(user.id),
                apiService.getSchoolEvents(user.branchId)
            ]);
            
            setCourses(coursesData);
            if (coursesData.length > 0) {
                setSelectedCourseId(coursesData[0].id);
            } else {
                setLoading(false); 
            }
    
            // FIX: Explicitly type the Set to string to resolve TypeScript error.
            const holidayDates = new Set<string>(
                eventsData
                    .filter(e => e.category === 'Holiday' && e.status === 'Approved')
                    .map(e => e.date)
            );
            setHolidays(holidayDates);
        };
        fetchInitialData();
    }, [user]);

    const fetchAttendanceData = useCallback(async () => {
        if (!selectedCourseId || !selectedDate || !user) return;
        setLoading(true);
        const [classId, subjectId] = selectedCourseId.split('|');
// FIX: Called the correct 'findCourseByTeacherAndSubject' method on apiService.
        const course = await apiService.findCourseByTeacherAndSubject(user!.id, subjectId);
        if (!course) {
            setLoading(false);
            return;
        }

        const studentData = await apiService.getStudentsForClass(classId);
        setStudents(studentData);

// FIX: Called the correct 'getAttendanceForCourse' method on apiService.
        const { isSaved: saved, attendance: savedAttendance } = await apiService.getAttendanceForCourse(course.id, selectedDate);
        setIsSaved(saved);
        
        const attendanceMap: Record<string, AttendanceStatus> = {};
        studentData.forEach(student => {
            const record = savedAttendance.find(a => a.studentId === student.id);
            attendanceMap[student.id] = record ? record.status : 'Present';
        });
        setAttendance(attendanceMap);

        setLoading(false);
    }, [selectedCourseId, selectedDate, user, refreshKey]);

    useEffect(() => {
        fetchAttendanceData();
    }, [fetchAttendanceData]);

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSave = async () => {
        if (!selectedCourseId || !selectedDate || !user) return;
        setIsSaving(true);
        const [classId, subjectId] = selectedCourseId.split('|');
// FIX: Called the correct 'findCourseByTeacherAndSubject' method on apiService.
        const course = await apiService.findCourseByTeacherAndSubject(user.id, subjectId);
        if (!course) {
            setIsSaving(false);
            return;
        }

        const recordsToSave = students.map(student => ({
            studentId: student.id,
            courseId: course.id,
            date: selectedDate,
            status: attendance[student.id] || 'Present',
            classId: classId
        }));

// FIX: Called the correct 'saveAttendance' method on apiService.
        await apiService.saveAttendance(recordsToSave as AttendanceRecord[]);
        setIsSaving(false);
        setStatusMessage('Attendance saved successfully!');
        triggerRefresh();
        setTimeout(() => setStatusMessage(''), 3000);
    };
    
    const handleSubmitRequest = () => {
        setRequestChangeFor(null);
        setStatusMessage('Your change request has been submitted for approval.');
        triggerRefresh();
        setTimeout(() => setStatusMessage(''), 5000);
    };
    
    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    const isHoliday = holidays.has(selectedDate);

    return (
         <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Attendance Management</h1>
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 border-b pb-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-dark mb-1">Course</label>
                        <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="w-full bg-white border border-slate-300 rounded-md py-2 px-3">
                            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <Input label="Date" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                </div>

                {statusMessage && <p className="text-center text-green-600 mb-4">{statusMessage}</p>}
                
                {loading ? <p>Loading students...</p> : isHoliday ? (
                    <div className="text-center p-8">
                        <p className="font-semibold text-lg text-brand-primary">This is a holiday.</p>
                        <p className="text-text-secondary-dark">Attendance cannot be marked.</p>
                    </div>
                ) : (
                    <div>
                        {isSaved && <p className="text-center text-blue-600 bg-blue-50 p-2 rounded mb-4">Attendance for this day has been saved. To make changes, please submit a rectification request.</p>}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b">
                                    <tr>
                                        <th className="p-2">Student Name</th>
                                        <th className="p-2 text-center" colSpan={3}>Status</th>
                                        {isSaved && <th className="p-2"></th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(student => (
                                        <tr key={student.id} className="border-b">
                                            <td className="p-2 font-medium">{student.name}</td>
                                            <td className="p-2 text-center">
                                                <label className="flex items-center justify-center">
                                                    <input type="radio" name={`att-${student.id}`} checked={attendance[student.id] === 'Present'} onChange={() => handleStatusChange(student.id, 'Present')} disabled={isSaved}/>
                                                    <span className="ml-2">Present</span>
                                                </label>
                                            </td>
                                             <td className="p-2 text-center">
                                                <label className="flex items-center justify-center">
                                                    <input type="radio" name={`att-${student.id}`} checked={attendance[student.id] === 'Absent'} onChange={() => handleStatusChange(student.id, 'Absent')} disabled={isSaved}/>
                                                    <span className="ml-2">Absent</span>
                                                </label>
                                            </td>
                                             <td className="p-2 text-center">
                                                <label className="flex items-center justify-center">
                                                    <input type="radio" name={`att-${student.id}`} checked={attendance[student.id] === 'Tardy'} onChange={() => handleStatusChange(student.id, 'Tardy')} disabled={isSaved}/>
                                                    <span className="ml-2">Tardy</span>
                                                </label>
                                            </td>
                                            {isSaved && (
                                                <td className="p-2 text-right">
                                                    <Button variant="secondary" className="!px-2 !py-1 text-xs" onClick={() => setRequestChangeFor(student)}>Request Change</Button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {!isSaved && (
                            <div className="mt-6 text-right">
                                <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Attendance'}</Button>
                            </div>
                        )}
                    </div>
                )}
            </Card>
            {requestChangeFor && selectedCourse && (
                <RequestChangeModal
                    student={{id: requestChangeFor.id, name: requestChangeFor.name}}
                    course={{id: selectedCourse.id, name: selectedCourse.name}}
                    date={selectedDate}
                    currentStatus={attendance[requestChangeFor.id]}
                    onClose={() => setRequestChangeFor(null)}
                    onSubmit={handleSubmitRequest}
                />
            )}
        </div>
    );
};

export default AttendanceManagement;