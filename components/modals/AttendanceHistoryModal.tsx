
import React, { useState, useMemo, useCallback } from 'react';
import type { AttendanceRecord } from '../../types.ts';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';
import { registrarApiService as apiService } from '../../services';

interface AttendanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  records: AttendanceRecord[];
}

const AttendanceHistoryModal: React.FC<AttendanceHistoryModalProps> = ({ isOpen, onClose, studentName, records }) => {
    if (!isOpen) return null;

    const [currentDate, setCurrentDate] = useState(new Date(2024, 3, 1)); // Default to April 2024 for mock data
    
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
        for (let i = 0; i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i++) {
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
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <Card className="w-full max-w-2xl h-[90vh] flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-text-primary-dark">Attendance History for {studentName}</h2>
                    <button onClick={onClose} className="text-3xl font-light text-slate-500 hover:text-slate-800 leading-none">&times;</button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2">
                     <div className="flex justify-between items-center mb-4">
                        <Button onClick={() => changeMonth(-1)}>&larr;</Button>
                        <h3 className="text-xl font-bold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                        <Button onClick={() => changeMonth(1)}>&rarr;</Button>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {weekdays.map(day => <div key={day} className="text-center font-bold text-text-secondary-dark text-sm">{day}</div>)}
                        {calendarDays.map((day, index) => {
                            if (!day) return <div key={`blank-${index}`} className="border rounded-md border-slate-100 h-16"></div>;
                            const status = getDayStatus(day);
                            const statusColor = {
                                Present: 'bg-green-200',
                                Absent: 'bg-red-200',
                                Tardy: 'bg-yellow-200',
                                NoRecord: 'bg-slate-100'
                            }[status];
                            return (
                                <div key={index} className={`p-2 h-16 text-center border rounded-md ${statusColor}`}>
                                    <span className="text-sm">{day.getDate()}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-4 text-right pt-4 border-t">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </Card>
        </div>
    );
};

export default AttendanceHistoryModal;