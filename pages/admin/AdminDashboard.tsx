// pages/admin/AdminDashboard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { AdminDashboardData, RegistrationRequest, PrincipalQuery, UserRole } from '../../types.ts';
import { AdminApiService } from '../../services';
import Card from '../../components/ui/Card.tsx';
import { BranchIcon, StudentsIcon, TeachersIcon, FinanceIcon, AttendanceIcon, RequestsIcon, AlertTriangleIcon, HelpCircleIcon } from '../../components/icons/Icons.tsx';
import Button from '../../components/ui/Button.tsx';
import { useNavigate } from 'react-router-dom';
import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';
import ContactCard from '../../components/shared/ContactCard.tsx';
import { useAuth } from '../../hooks/useAuth.ts';
const adminApiService = new AdminApiService();
const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; onClick?: () => void }> = ({ title, value, icon, onClick }) => (
    <Card className={`flex items-center p-4 ${onClick ? 'cursor-pointer hover:bg-slate-50' : ''}`} onClick={onClick}>
        <div className="p-3 mr-4 text-brand-secondary bg-brand-primary/10 rounded-full">{icon}</div>
        <div>
            <p className="text-sm font-medium text-text-secondary-dark">{title}</p>
            <p className="text-2xl font-semibold text-text-primary-dark">{value}</p>
        </div>
    </Card>
);

const LiveFeedItem: React.FC<{ item: AdminDashboardData['liveFeed'][0] }> = ({ item }) => {
    const icons = {
        alert: <div className="bg-red-100 text-red-600 p-2 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg></div>,
        event: <div className="bg-blue-100 text-blue-600 p-2 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/></svg></div>,
        exam: <div className="bg-green-100 text-green-600 p-2 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
    };
    return (
        <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg">
            {icons[item.type]}
            <div>
                <p className="text-sm text-text-primary-dark">{item.message}</p>
                <p className="text-xs text-text-secondary-dark">{item.school} - {item.timestamp.toLocaleTimeString()}</p>
            </div>
        </div>
    );
};

const SchoolPerformanceList: React.FC<{
    title: string;
    schools: { id: string; name: string; healthScore: number; }[];
    theme: 'green' | 'red';
    onViewAll: () => void;
}> = ({ title, schools, theme, onViewAll }) => {
    const themeClasses = {
        green: { iconBg: 'bg-green-100', iconText: 'text-green-600', scoreText: 'text-green-600' },
        red: { iconBg: 'bg-red-100', iconText: 'text-red-600', scoreText: 'text-red-600' },
    };
    const classes = themeClasses[theme];
    
    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-text-primary-dark">{title}</h2>
                <Button variant="secondary" className="!text-xs !px-2 !py-1" onClick={onViewAll}>View All</Button>
            </div>
            <div className="space-y-3">
                {schools.map((school, index) => (
                    <div key={school.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <span className={`font-bold text-lg w-8 text-center ${theme === 'green' ? 'text-brand-accent' : 'text-text-secondary-dark'}`}>#{index + 1}</span>
                            <div>
                                <p className="font-semibold text-text-primary-dark">{school.name}</p>
                                <p className={`text-xs font-medium ${classes.scoreText}`}>Health Score: {school.healthScore}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const AdminDashboard: React.FC = () => {
    const [data, setData] = useState<AdminDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { refreshKey } = useDataRefresh();
    const { user } = useAuth();

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const result = await adminApiService.getAdminDashboardData(user.role);
        setData(result);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshKey]);

    if (loading) return <div>Loading dashboard...</div>;
    if (!data) return <div>Could not load dashboard data.</div>;
    
    const { summary, feeTrend, liveFeed, topPerformingSchools, bottomPerformingSchools, pendingRequests, principalQueries, performanceTrend } = data;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">System-Wide Dashboard</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
                <StatCard title="Total Schools" value={summary.totalSchools.toString()} icon={<BranchIcon className="w-5 h-5"/>} />
                <StatCard title="Total Students" value={summary.totalStudents.toLocaleString()} icon={<StudentsIcon className="w-5 h-5"/>} />
                <StatCard title="Total Teachers" value={summary.totalTeachers.toLocaleString()} icon={<TeachersIcon className="w-5 h-5"/>} />
                <StatCard title="Active Branches" value={summary.activeBranches.toString()} icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12.5"/><path d="m17 12 5 3-5 3v-6Z"/></svg>} />
                {user?.role === 'SuperAdmin' ? (
                    <StatCard title="ERP Revenue (This Month)" value={`₹${summary.feesCollected.toLocaleString()}`} icon={<FinanceIcon className="w-5 h-5"/>} />
                ) : (
                    <StatCard title="Fees Collected" value={`${(summary.feesCollected / 1000).toFixed(1)}k`} icon={<FinanceIcon className="w-5 h-5"/>} />
                )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SchoolPerformanceList 
                            title="Top 5 Performing Schools"
                            schools={topPerformingSchools}
                            theme="green"
                            onViewAll={() => navigate('/admin/schools')}
                        />
                         <SchoolPerformanceList 
                            title="Bottom 5 Performing Schools"
                            schools={bottomPerformingSchools}
                            theme="red"
                            onViewAll={() => navigate('/admin/schools')}
                        />
                    </div>
                    <Card>
                        <h2 className="text-xl font-semibold text-text-primary-dark mb-4">System-Wide Fee Collection Trend</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={feeTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={(value) => `${value/1000}k`} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="collected" stroke="#F97316" />
                                <Line type="monotone" dataKey="pending" stroke="#94a3b8" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card>
                        <h2 className="text-xl font-semibold text-text-primary-dark mb-4">Overall Performance Trend</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={performanceTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis domain={[75, 100]} tickFormatter={(value) => `${value.toFixed(0)}`} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="averageScore" stroke="#4F46E5" name="Avg. Score" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <h2 className="text-xl font-semibold text-text-primary-dark mb-4">Live Event Feed</h2>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                           {liveFeed.map(item => <LiveFeedItem key={item.id} item={item}/>)}
                        </div>
                    </Card>
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-text-primary-dark">Principal Queries</h2>
                            <span className="font-bold text-lg bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">{principalQueries.count}</span>
                        </div>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                            {principalQueries.queries.map(req => (
                                <div key={req.id} className="p-3 bg-slate-50 rounded-lg">
                                    <p className="font-semibold text-sm text-text-primary-dark">{req.subject}</p>
                                    <p className="text-xs text-text-secondary-dark">{req.schoolName} - by {req.principalName}</p>
                                </div>
                            ))}
                            {principalQueries.count === 0 && (
                                <p className="text-sm text-center text-text-secondary-dark p-4">No open principal queries.</p>
                            )}
                        </div>
                        <Button className="w-full mt-4" onClick={() => navigate('/admin/principal-queries')}>
                            View All Queries
                        </Button>
                    </Card>
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-text-primary-dark">Pending Requests</h2>
                            <span className="font-bold text-lg bg-red-100 text-red-700 px-3 py-1 rounded-full">{pendingRequests.count}</span>
                        </div>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                            {pendingRequests.requests.map(req => (
                                <div key={req.id} className="p-3 bg-slate-50 rounded-lg">
                                    <p className="font-semibold text-sm text-text-primary-dark">{req.schoolName}</p>
                                    <p className="text-xs text-text-secondary-dark">{req.location} - by {req.principalName}</p>
                                </div>
                            ))}
                            {pendingRequests.count === 0 && (
                                <p className="text-sm text-center text-text-secondary-dark p-4">No pending registration requests.</p>
                            )}
                        </div>
                        <Button className="w-full mt-4" onClick={() => navigate('/admin/requests')}>
                            View All Requests
                        </Button>
                    </Card>
                     <Card>
                        <h2 className="text-xl font-semibold text-text-primary-dark mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="secondary" onClick={() => navigate('/admin/requests')}>Approve Schools</Button>
                            <Button variant="secondary" onClick={() => navigate('/admin/analytics')}>View Reports</Button>
                            <Button variant="secondary" onClick={() => navigate('/admin/communication')}>Broadcast</Button>
                            <Button variant="secondary" onClick={() => navigate('/admin/users')}>Manage Users</Button>
                        </div>
                    </Card>
                </div>
            </div>
            <div className="mt-6">
                <ContactCard />
            </div>
        </div>
    );
};

export default AdminDashboard;