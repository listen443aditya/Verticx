

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
// FIX: Corrected import to use named export
import { studentApiService as apiService } from '../../services';
import type { StudentDashboardData } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import { FileTextIcon } from '../../components/icons/Icons.tsx';

const MyAssignments: React.FC = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<StudentDashboardData['assignments'] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const data = await apiService.getStudentDashboardData(user.id);
                setAssignments(data.assignments);
            } catch (error) {
                console.error("Failed to fetch assignments", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) {
        return <Card><p>Loading assignments...</p></Card>;
    }

    if (!assignments || assignments.pending.length === 0) {
        return (
            <div>
                <h1 className="text-3xl font-bold">Homework & Assignments</h1>
                <Card className="mt-6">
                    <p className="text-center p-8 text-text-secondary-dark">
                        You have no pending assignments. Great job!
                    </p>
                </Card>
            </div>
        );
    }
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Homework & Assignments</h1>
            <Card>
                <h2 className="text-xl font-semibold text-text-primary-dark mb-4">Pending Assignments</h2>
                <div className="space-y-4">
                    {assignments.pending.map(item => (
                        <div key={item.id} className="bg-slate-50 p-4 rounded-lg flex items-start gap-4">
                            <div className="flex-shrink-0 bg-brand-primary/10 text-brand-primary rounded-full p-3">
                                <FileTextIcon className="w-6 h-6" />
                            </div>
                            <div className="flex-grow">
                                <p className="font-bold text-text-primary-dark">{item.title}</p>
                                <p className="text-sm text-text-secondary-dark">{item.courseName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-red-500">Due: {new Date(item.dueDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default MyAssignments;