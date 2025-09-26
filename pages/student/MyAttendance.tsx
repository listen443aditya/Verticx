import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
// FIX: Corrected import to use named export
import { studentApiService as apiService } from '../../services';
import type { AttendanceRecord, LeaveApplication, Branch } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';

// Modal to show daily breakdown
const DayDetailsModal: React.FC<{ date: Date; records: AttendanceRecord[]; onClose: () => void; }> = ({ date, records, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold">Attendance for {date.toLocaleDateString()}</h2>
                    <button onClick={onClose} className="text-3xl font-light">&times;</button>
                </div>
                <div className="mt-4 max-h-60 overflow-y-auto">
                    {records.length > 0 ? (
                        <ul className="space-y-2">
                            {records.map((rec, i) => (
                                <li key={i} className="flex justify-between items-center p-2 bg-slate-100 rounded">
                                    <span className="text-sm">{apiService.getCourseNameById(rec.courseId)}</span>
                                    <span className="text-sm font-semibold">{rec.status}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-slate-500">No records for this day.</p>
                    )}
                </div>
                 <div className="mt-6 text-right">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </Card>
        </div>
    );
};

const MyAttendance: React.FC = () => {
    const { user } = useAuth();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
    const [branch, setBranch] = useState<Branch | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDayDetails, setSelectedDayDetails] = useState<{date: Date, records: AttendanceRecord[]}|null>(null);

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!user?.branchId) return;
            setLoading(true);
            const [attendanceData, leaveData, branchData] = await Promise.all([
                apiService.getStudentAttendance(user.id),
                apiService.getLeaveApplicationsForUser(user.id),
                apiService.getBranchById(user.branchId)
            ]);
            setRecords(attendanceData);
            setLeaves(leaveData.filter(l => l.status === 'Approved'));
            setBranch(branchData);
            
            // Set initial calendar date based on session start
            if (branchData?.academicSessionStartDate) {
                const sessionStartDate = new Date(branchData.academicSessionStartDate);
                const today = new Date();
                // If today is before the session start, show the session start month. Otherwise, show current month.
                if (today < sessionStartDate) {
                    setCurrentDate(sessionStartDate);
                } else {
                    setCurrentDate(today);
                }
            } else {
                setCurrentDate(new Date());
            }

            setLoading(false);
        };
        fetchAttendance();
    }, [user]);

    const recordsByDate = useMemo(() => {
        const map = new Map<string, AttendanceRecord[]>();
        records.forEach(rec => {
            const dateKey = rec.date;
            if (!map.has(dateKey)) map.set(dateKey, []);
            map.get(dateKey)!.push(rec);
        });
        return map;
    }, [records]);

    const getDayStatus = useCallback((date: Date) => {
        const dateString = date.toISOString().split('T')[0];
        const dayRecords = recordsByDate.get(dateString);
        if (!dayRecords || dayRecords.length === 0) return 'NoRecord';
        if (dayRecords.some(r => r.status === 'Absent')) return 'Absent';
        if (dayRecords.some(r => r.status === 'Tardy')) return 'Tardy';
        return 'Present';
    }, [recordsByDate]);

    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const days = [];
        const startOffset = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;
        for (let i = 0; i < startOffset; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const calendarDays = generateCalendarDays();
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const changeMonth = (delta: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(1); 
            newDate.setMonth(newDate.getMonth() + delta);
            return newDate;
        });
    };

    if (loading) return <Card><p>Loading your attendance history...</p></Card>;

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">My Attendance</h1>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <Button onClick={() => changeMonth(-1)}>&larr;</Button>
                    <h2 className="text-xl font-bold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                    <Button onClick={() => changeMonth(1)}>&rarr;</Button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {weekdays.map(day => <div key={day} className="text-center font-bold text-text-secondary-dark text-sm">{day}</div>)}
                    {calendarDays.map((day, index) => {
                        if (!day) return <div key={`blank-${index}`} className="border rounded-md border-slate-100 h-20"></div>;
                        const status = getDayStatus(day);
                        const statusColor = {
                            Present: 'bg-green-200',
                            Absent: 'bg-red-200',
                            Tardy: 'bg-yellow-200',
                            NoRecord: 'bg-slate-100'
                        }[status];
                        return (
                            <div key={index} className={`p-2 h-20 border rounded-md ${statusColor}`}>
                                <span className="text-sm font-semibold">{day.getDate()}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-center flex-wrap gap-4 mt-6 text-sm">
                    <span className="flex items-center"><div className="w-4 h-4 bg-green-200 mr-2 rounded"></div>Present</span>
                    <span className="flex items-center"><div className="w-4 h-4 bg-yellow-200 mr-2 rounded"></div>Tardy</span>
                    <span className="flex items-center"><div className="w-4 h-4 bg-red-200 mr-2 rounded"></div>Absent</span>
                </div>
            </Card>
            {selectedDayDetails && (
                <DayDetailsModal 
                    date={selectedDayDetails.date} 
                    records={selectedDayDetails.records} 
                    onClose={() => setSelectedDayDetails(null)} 
                />
            )}
        </div>
    );
};

export default MyAttendance;