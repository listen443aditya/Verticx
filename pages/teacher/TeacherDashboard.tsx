import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
// FIX: Corrected import to use teacherApiService aliased as apiService.
import { teacherApiService as apiService, sharedApiService } from '../../services';
import Card from '../../components/ui/Card.tsx';
import Button from '../../components/ui/Button.tsx';
import type { TeacherDashboardData, TimetableSlot, TransportRoute, BusStop, Branch, User } from '../../types.ts';
// FIX: Corrected react-router-dom import for v6+
import { useNavigate } from 'react-router-dom';
import { RequestsIcon, TransportIcon } from '../../components/icons/Icons.tsx';
import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';
// FIX: The component is default-exported, so use a default import.
import AssignHomeworkModal from '../../components/modals/AssignHomeworkModal.tsx';
import ContactCard from '../../components/shared/ContactCard.tsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const WeeklySchedule: React.FC<{ schedule: TimetableSlot[] }> = ({ schedule }) => {
    const today = new Date().toLocaleString('en-us', { weekday: 'long' }) as any;
    const [selectedDay, setSelectedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>(days.includes(today) ? today : 'Monday');

    const daySchedule = schedule
        .filter(slot => slot.day === selectedDay)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const tabClasses = (day: string) => `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none whitespace-nowrap ${selectedDay === day ? 'bg-slate-200 text-text-primary-dark' : 'bg-slate-100 text-text-secondary-dark hover:bg-slate-200'}`;

    return (
        <div>
            <div className="w-full overflow-x-auto">
                <div className="flex border-b border-slate-200">
                    {days.map(day => (
                        <button key={day} onClick={() => setSelectedDay(day)} className={tabClasses(day)}>{day}</button>
                    ))}
                </div>
            </div>
            <div className="space-y-3 mt-4">
                {daySchedule.length > 0 ? daySchedule.map(slot => {
                    const sClass = apiService.getClassById(slot.classId);
                    const subject = apiService.getSubjectById(slot.subjectId);
                    return (
                        <div key={slot.id} className="flex items-center p-3 bg-slate-100 rounded-lg">
                            <div className="w-20 font-bold text-brand-secondary">{slot.startTime}</div>
                            <div className="flex-grow">
                                <p className="font-semibold text-text-primary-dark">
                                    {sClass ? `Grade ${sClass.gradeLevel}-${sClass.section}` : 'Unknown Class'} - {subject?.name || 'Unknown Subject'}
                                </p>
                                <p className="text-sm text-text-secondary-dark">Room: {slot.room || 'N/A'}</p>
                            </div>
                        </div>
                    );
                }) : <p className="text-center text-text-secondary-dark p-4">No classes scheduled for {selectedDay}.</p>}
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; onClick?: () => void; }> = ({ title, value, icon, onClick }) => (
    <Card className={`flex items-center p-4 ${onClick ? 'cursor-pointer hover:bg-slate-50' : ''}`} onClick={onClick}>
        <div className="p-3 mr-4 text-brand-secondary bg-brand-primary/10 rounded-full">{icon}</div>
        <div>
            <p className="text-sm font-medium text-text-secondary-dark">{title}</p>
            <p className="text-2xl font-semibold text-text-primary-dark">{value}</p>
        </div>
    </Card>
);

const TeacherDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { refreshKey, triggerRefresh } = useDataRefresh();
    const [data, setData] = useState<TeacherDashboardData | null>(null);
    const [branch, setBranch] = useState<Branch | null>(null);
    const [principal, setPrincipal] = useState<User | null>(null);
    const [transportDetails, setTransportDetails] = useState<{ route: TransportRoute, stop: BusStop } | null>(null);
    const [loading, setLoading] = useState(true);
    const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);

    useEffect(() => {
        const combinedFetch = async () => {
            if (!user?.branchId) return;
            setLoading(true);
            const [dashboardData, transportData, branchData] = await Promise.all([
                apiService.getTeacherDashboardData(user.id),
                apiService.getTransportDetailsForMember(user.id, 'Teacher'),
                sharedApiService.getBranchById(user.branchId)
            ]);
            setData(dashboardData);
            setTransportDetails(transportData);
            setBranch(branchData);
    
            if (branchData?.principalId) {
                const principalData = await sharedApiService.getUserById(branchData.principalId);
                setPrincipal(principalData || null);
            }
    
            setLoading(false);
        }
        combinedFetch();
    }, [user, refreshKey]);

    const handleHomeworkSaved = () => {
        setIsHomeworkModalOpen(false);
        triggerRefresh();
    };

    if (loading) return <div>Loading dashboard...</div>;
    if (!data) return <div>Could not load dashboard data.</div>;

    const { weeklySchedule, assignmentsToReview, upcomingDeadlines, classPerformance, atRiskStudents, mentoredClass, pendingMeetingRequests, library } = data;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-primary-dark mb-6">Teacher Dashboard</h1>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                <StatCard title="Assignments to Review" value={String(assignmentsToReview)} icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>} />
                <StatCard title="Pending Meetings" value={String(pendingMeetingRequests)} icon={<RequestsIcon className="w-5 h-5"/>} onClick={() => navigate('/teacher/meetings')} />
                <StatCard title="Books Issued" value={String(library.issuedBooks.length)} icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>} onClick={() => navigate('/teacher/library')} />
                {mentoredClass && <StatCard title="Mentored Class" value={mentoredClass.name} icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} onClick={() => navigate('/teacher/attendance')} />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <h2 className="text-xl font-semibold mb-4">Weekly Schedule</h2>
                        <WeeklySchedule schedule={weeklySchedule} />
                    </Card>
                    <Card>
                        <h2 className="text-xl font-semibold text-text-primary-dark mb-4">Class Performance Overview</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={classPerformance} margin={{ top: 5, right: 20, left: -10, bottom: 70 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="className" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
                                <YAxis domain={[0, 100]} label={{ value: 'Average Score (%)', angle: -90, position: 'insideLeft' }} />
                                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                                <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '20px'}}/>
                                <Bar dataKey="average" fill="#4F46E5" name="Average Score" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                    {transportDetails && (
                        <Card>
                             <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><TransportIcon className="w-5 h-5 text-brand-secondary"/> Transport Details</h3>
                             <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-text-secondary-dark">Route:</span> <span className="font-semibold">{transportDetails.route.routeName}</span></div>
                                <div className="flex justify-between"><span className="text-text-secondary-dark">Your Stop:</span> <span className="font-semibold">{transportDetails.stop.name}</span></div>
                                <div className="flex justify-between"><span className="text-text-secondary-dark">Pickup Time:</span> <span className="font-semibold">{transportDetails.stop.pickupTime}</span></div>
                            </div>
                        </Card>
                    )}
                </div>
                <div className="space-y-6">
                    <Card>
                        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                        <div className="flex flex-col gap-2">
                             <Button variant="secondary" onClick={() => setIsHomeworkModalOpen(true)}>Assign Homework</Button>
                             <Button variant="secondary" onClick={() => navigate('/teacher/quizzes')}>Manage Quizzes</Button>
                             <Button variant="secondary" onClick={() => navigate('/teacher/gradebook')}>Update Gradebook</Button>
                        </div>
                    </Card>
                    <Card>
                        <h2 className="text-xl font-semibold mb-4">Upcoming Deadlines</h2>
                        <div className="space-y-2">
                            {upcomingDeadlines.length > 0 ? upcomingDeadlines.map(d => (
                                <div key={d.id} className="bg-slate-100 p-2 rounded-md text-sm">
                                    <p className="font-medium">{d.title}</p>
                                    <p className="text-xs text-text-secondary-dark">Due: {new Date(d.dueDate).toLocaleDateString()}</p>
                                </div>
                            )) : <p className="text-sm text-center text-text-secondary-dark p-4">No upcoming deadlines.</p>}
                        </div>
                    </Card>
                    <Card>
                        <h2 className="text-xl font-semibold mb-4">At-Risk Students</h2>
                        <div className="space-y-2">
                             {atRiskStudents.length > 0 ? atRiskStudents.map(s => (
                                <div key={s.studentId} className="bg-red-50 p-2 rounded-md text-sm">
                                    <p className="font-medium text-red-800">{s.studentName}</p>
                                    <p className="text-xs text-red-600">{s.reason}: {s.value}</p>
                                </div>
                            )) : <p className="text-sm text-center text-text-secondary-dark p-4">No students currently at risk.</p>}
                        </div>
                    </Card>
                </div>
            </div>
             <AssignHomeworkModal
                isOpen={isHomeworkModalOpen}
                onClose={() => setIsHomeworkModalOpen(false)}
                onSave={handleHomeworkSaved}
            />
             <div className="mt-6">
                <ContactCard branch={branch || undefined} principalName={principal?.name} />
            </div>
        </div>
    );
};

export default TeacherDashboard;