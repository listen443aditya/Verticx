

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
// FIX: Corrected import to use the specific studentApiService
import { studentApiService as apiService } from '../../services';
import type { ComplaintAboutStudent } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import { AlertTriangleIcon } from '../../components/icons/Icons.tsx';

const DisciplineLog: React.FC = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState<ComplaintAboutStudent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await apiService.getComplaintsAboutStudent(user.id);
            setComplaints(data);
        } catch (error) {
            console.error("Failed to fetch complaints", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Discipline Log</h1>
            <Card>
                <p className="mb-6 text-text-secondary-dark">This log shows official complaints raised by teachers or school administration regarding your conduct.</p>
                
                {loading ? <p>Loading...</p> : complaints.length === 0 ? (
                    <div className="text-center p-8">
                        <p className="text-text-secondary-dark">You have a clean record. No complaints have been raised against you.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {complaints.map(complaint => (
                             <div key={complaint.id} className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-4">
                                <div className="flex-shrink-0 text-red-500 mt-1">
                                    <AlertTriangleIcon className="w-6 h-6" />
                                </div>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-red-800">Complaint from: {complaint.raisedByName} ({complaint.raisedByRole})</p>
                                        <p className="text-xs text-red-600">{new Date(complaint.submittedAt).toLocaleDateString()}</p>
                                    </div>
                                    <p className="mt-2 text-sm text-red-900 whitespace-pre-wrap">{complaint.complaintText}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default DisciplineLog;