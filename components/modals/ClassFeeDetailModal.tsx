import React, { useEffect, useState, useCallback } from 'react';
import { registrarApiService as apiService } from '../../services';
import type { DefaulterDetails } from '../../types.ts';
import Card from '../ui/Card.tsx';
import Button from '../ui/Button.tsx';

interface ClassFeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
}

const ClassFeeDetailModal: React.FC<ClassFeeDetailModalProps> = ({ isOpen, onClose, classId, className }) => {
    const [defaulters, setDefaulters] = useState<DefaulterDetails[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const data = await apiService.getDefaultersForClass(classId);
        setDefaulters(data);
        setLoading(false);
    }, [classId]);

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, fetchData]);

    const handleSendReminder = (studentName: string) => {
        alert(`Reminder SMS sent to the guardian of ${studentName}. (Mock Action)`);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <Card className="w-full max-w-4xl h-[90vh] flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary-dark">Fee Defaulters</h2>
                        <p className="text-text-secondary-dark">{className}</p>
                    </div>
                    <button onClick={onClose} className="text-3xl font-light text-slate-500 hover:text-slate-800 leading-none">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2">
                    {loading ? (
                        <p>Loading defaulter list...</p>
                    ) : defaulters.length === 0 ? (
                        <p className="text-center p-8 text-text-secondary-dark">No fee defaulters in this class.</p>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="border-b border-slate-200 text-sm text-text-secondary-dark sticky top-0 bg-surface-dark">
                                <tr>
                                    <th className="p-4">Student Name</th>
                                    <th className="p-4">Roll No.</th>
                                    <th className="p-4">Guardian Phone</th>
                                    <th className="p-4 text-right">Pending Amount</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {defaulters.map(student => (
                                    <tr key={student.studentId} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-4 font-medium text-text-primary-dark">{student.studentName}</td>
                                        <td className="p-4">{student.rollNo || 'N/A'}</td>
                                        <td className="p-4">{student.guardianPhone}</td>
                                        <td className="p-4 text-right font-semibold text-red-600">{student.pendingAmount.toLocaleString()}</td>
                                        <td className="p-4 text-right">
                                            <Button variant="secondary" className="!px-3 !py-1 text-xs" onClick={() => handleSendReminder(student.studentName)}>
                                                Send Reminder
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="mt-4 pt-4 border-t text-right">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </Card>
        </div>
    );
};

export default ClassFeeDetailModal;