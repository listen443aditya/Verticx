import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
// FIX: Changed default import to named import for apiService.
import { librarianApiService as apiService, sharedApiService } from '../../services';
import type { LibrarianDashboardData, Branch, User } from '../../types.ts';
import Card from '../../components/ui/Card.tsx';
import { LibraryIcon, MoveIcon, AlertTriangleIcon, UsersIcon } from '../../components/icons/Icons.tsx';
import ContactCard from '../../components/shared/ContactCard.tsx';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <Card className="flex items-center p-4">
        <div className="p-3 mr-4 text-brand-secondary bg-brand-primary/10 rounded-full">{icon}</div>
        <div>
            <p className="text-sm font-medium text-text-secondary-dark">{title}</p>
            <p className="text-2xl font-semibold text-text-primary-dark">{value}</p>
        </div>
    </Card>
);

const LibrarianDashboard: React.FC = () => {
    const { user } = useAuth();
    const [data, setData] = useState<LibrarianDashboardData | null>(null);
    const [branch, setBranch] = useState<Branch | null>(null);
    const [principal, setPrincipal] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user?.branchId) return;
        setLoading(true);
        const [result, branchData] = await Promise.all([
            apiService.getLibrarianDashboardData(user.branchId),
            sharedApiService.getBranchById(user.branchId),
        ]);
        setData(result);
        setBranch(branchData);
        if (branchData?.principalId) {
            const principalData = await sharedApiService.getUserById(branchData.principalId);
            setPrincipal(principalData || null);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <div>Loading dashboard...</div>;
    if (!data) return <div>Could not load dashboard data.</div>;

    const { summary, recentActivity, overdueList, classIssuanceSummary } = data;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Librarian Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard title="Total Books" value={summary.totalBooks.toLocaleString()} icon={<LibraryIcon className="w-5 h-5"/>} />
                <StatCard title="Books Issued" value={summary.issuedBooks.toLocaleString()} icon={<MoveIcon className="w-5 h-5"/>} />
                <StatCard title="Books Overdue" value={summary.overdueBooks.toLocaleString()} icon={<AlertTriangleIcon className="w-5 h-5"/>} />
                <StatCard title="Unique Members" value={summary.uniqueMembers.toLocaleString()} icon={<UsersIcon className="w-5 h-5"/>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <h2 className="text-xl font-semibold text-text-primary-dark mb-4">Recent Activity</h2>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {recentActivity.length > 0 ? recentActivity.map(item => (
                            <div key={item.id} className={`p-3 rounded-lg flex justify-between items-center ${item.returnedDate ? 'bg-slate-100' : 'bg-blue-50'}`}>
                                <div>
                                    <p className="text-sm font-medium">{item.memberName} {item.returnedDate ? 'returned' : 'issued'} "{item.bookTitle}"</p>
                                    <p className="text-xs text-text-secondary-dark">{new Date(item.returnedDate || item.issuedDate).toLocaleString()}</p>
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.returnedDate ? 'bg-slate-200 text-slate-700' : 'bg-blue-200 text-blue-800'}`}>
                                    {item.returnedDate ? 'Returned' : 'Issued'}
                                </span>
                            </div>
                        )) : <p className="text-center text-text-secondary-dark p-4">No recent library activity.</p>}
                    </div>
                </Card>
                <Card className="lg:col-span-1">
                    <h2 className="text-xl font-semibold text-text-primary-dark mb-4">Overdue Books</h2>
                     <div className="space-y-2 max-h-96 overflow-y-auto">
                        {overdueList.length > 0 ? overdueList.map(item => (
                            <div key={item.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm font-semibold text-red-800">{item.bookTitle}</p>
                                <p className="text-xs text-red-600">Issued to: {item.memberName} ({item.memberDetails})</p>
                                <p className="text-xs text-red-600">
                                    Due Date: {new Date(item.dueDate).toLocaleDateString()}
                                    <span className="font-bold ml-2">(Fine: {item.fineAmount.toFixed(2)})</span>
                                </p>
                            </div>
                        )) : <p className="text-center text-text-secondary-dark p-4">No overdue books. Well done!</p>}
                    </div>
                </Card>
                 <Card className="lg:col-span-1">
                    <h2 className="text-xl font-semibold text-text-primary-dark mb-4">Issuance by Class</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {classIssuanceSummary.length > 0 ? classIssuanceSummary.map(summary => (
                            <details key={summary.classId} className="bg-slate-50 p-3 rounded-lg">
                                <summary className="cursor-pointer font-medium flex justify-between items-center">
                                    <span>{summary.className}</span>
                                    <div className="text-right">
                                        <span className="font-semibold">{summary.issuedCount} Books</span>
                                        <span className="text-xs text-text-secondary-dark ml-2">({summary.totalValue.toFixed(2)})</span>
                                    </div>
                                </summary>
                                <ul className="mt-2 pt-2 border-t text-xs list-disc pl-5">
                                    {summary.studentsWithBooks.map(s => (
                                        <li key={s.studentName}>{s.studentName} ({s.bookCount} book{s.bookCount > 1 ? 's' : ''})</li>
                                    ))}
                                </ul>
                            </details>
                        )) : <p className="text-center text-text-secondary-dark p-4">No books currently issued to students.</p>}
                    </div>
                </Card>
            </div>
            <div className="mt-6">
                <ContactCard branch={branch || undefined} principalName={principal?.name} />
            </div>
        </div>
    );
};

export default LibrarianDashboard;