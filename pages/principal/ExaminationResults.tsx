import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { principalApiService as apiService } from '../../services';
import type { Examination } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import ConfirmationModal from '../../components/ui/ConfirmationModal.tsx';
import SendResultsSmsModal from '../../components/modals/SendResultsSmsModal.tsx';

const ExaminationResults: React.FC = () => {
    const { user } = useAuth();
    const [examinations, setExaminations] = useState<Examination[]>([]);
    const [loading, setLoading] = useState(true);
    const [publishingExam, setPublishingExam] = useState<Examination | null>(null);
    const [showSmsModalFor, setShowSmsModalFor] = useState<Examination | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user?.branchId) return;
        setLoading(true);
        const exams = await apiService.getExaminationsWithResultStatus(user.branchId);
        setExaminations(exams);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePublishConfirm = async () => {
        if (!publishingExam) return;
        setIsActionLoading(true);
        await apiService.publishExaminationResults(publishingExam.id);
        setPublishingExam(null);
        await fetchData();
        setIsActionLoading(false);
    };

    const getStatusChip = (status: Examination['status']) => {
        switch (status) {
            case 'Upcoming': return 'bg-blue-100 text-blue-800';
            case 'Ongoing': return 'bg-green-100 text-green-800';
            case 'Completed': return 'bg-slate-100 text-slate-800';
        }
    };
    
    const getResultStatusChip = (status: Examination['resultStatus']) => {
        switch (status) {
            case 'Published': return 'bg-green-100 text-green-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Examination Results</h1>
            <Card>
                <h2 className="text-xl font-semibold mb-4">Examination Periods</h2>
                {loading ? <p>Loading examinations...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b">
                                <tr>
                                    <th className="p-4">Examination Name</th>
                                    <th className="p-4">Dates</th>
                                    <th className="p-4">Exam Status</th>
                                    <th className="p-4">Result Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {examinations.map(exam => (
                                    <tr key={exam.id} className="border-b hover:bg-slate-50">
                                        <td className="p-4 font-medium">{exam.name}</td>
                                        <td className="p-4 text-sm">{exam.startDate} to {exam.endDate}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(exam.status)}`}>{exam.status}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getResultStatusChip(exam.resultStatus)}`}>{exam.resultStatus}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                {exam.status === 'Completed' && exam.resultStatus === 'Pending' && (
                                                    <Button 
                                                        onClick={() => setPublishingExam(exam)}
                                                        disabled={isActionLoading}
                                                    >
                                                        Publish Results
                                                    </Button>
                                                )}
                                                {exam.resultStatus === 'Published' && (
                                                    <Button 
                                                        variant="secondary"
                                                        onClick={() => setShowSmsModalFor(exam)}
                                                        disabled={isActionLoading}
                                                    >
                                                        Send SMS
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {publishingExam && (
                <ConfirmationModal
                    isOpen={!!publishingExam}
                    onClose={() => setPublishingExam(null)}
                    onConfirm={handlePublishConfirm}
                    title="Confirm Result Publication"
                    message={<>Are you sure you want to publish the results for <strong>{publishingExam.name}</strong>? This action will make all marks for this exam visible to students and parents and cannot be undone.</>}
                    confirmText="Publish"
                    confirmVariant="primary"
                    isConfirming={isActionLoading}
                />
            )}

            {showSmsModalFor && (
                <SendResultsSmsModal
                    examination={showSmsModalFor}
                    onClose={() => setShowSmsModalFor(null)}
                />
            )}
        </div>
    );
};

export default ExaminationResults;