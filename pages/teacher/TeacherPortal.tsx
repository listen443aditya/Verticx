import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.ts';
import { 
    DashboardIcon, LogoutIcon, VerticxLogo, AcademicsIcon,
    FileTextIcon, CommunicationIcon, MenuIcon, XIcon,
    ClipboardListIcon, UsersIcon, BookOpenIcon,
    CalendarCheckIcon, CalendarIcon, FeedbackIcon, AttendanceIcon
} from '../../components/icons/Icons.tsx';
import UserProfileModal from '../../components/modals/UserProfileModal.tsx';
import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';

// Teacher Pages
import TeacherDashboard from './TeacherDashboard.tsx';
import AttendanceManagement from './AttendanceManagement.tsx';
import Gradebook from './Gradebook.tsx';
import StudentInformation from './StudentInformation.tsx';
import SyllabusManagement from './SyllabusManagement.tsx';
import ContentManagement from './ContentManagement.tsx';
import MyQuizzes from './MyQuizzes.tsx';
import CreateTest from './CreateTest.tsx';
import ViewTest from './ViewTest.tsx';
import HomeworkHistory from './HomeworkHistory.tsx';
import MeetingRequests from './MeetingRequests.tsx';
import Library from './Library.tsx';
import Events from './Events.tsx';
import ExamMarksEntry from './ExamMarksEntry.tsx';
import MyAttendance from './MyAttendance.tsx';
import ApplyForLeave from './ApplyForLeave.tsx';


const TeacherSidebarContent: React.FC<{ onClose?: () => void, onOpenProfile: () => void }> = ({ onClose, onOpenProfile }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    
    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 overflow-hidden ${
        isActive ? 'bg-brand-primary text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        }`;

    return (
        <aside className="w-64 bg-slate-800 text-slate-100 flex flex-col p-4 border-r border-slate-700 h-full">
            <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center overflow-hidden">
                    <div className="w-8 h-8 mr-3 flex-shrink-0">
                        <VerticxLogo className="w-full h-full" />
                    </div>
                    <span className="text-xl font-bold text-white truncate min-w-0">VERTICX</span>
                </div>
                {onClose && (
                    <button onClick={onClose} className="lg:hidden p-1 text-slate-300 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                )}
            </div>
            <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
                <NavLink to="/teacher/dashboard" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><DashboardIcon className="w-full h-full" /></div><span className="truncate min-w-0">Dashboard</span></NavLink>
                {user?.enabledFeatures?.teacher_attendance && <NavLink to="/teacher/attendance" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><ClipboardListIcon className="w-full h-full" /></div><span className="truncate min-w-0">Attendance</span></NavLink>}
                <NavLink to="/teacher/my-attendance" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><AttendanceIcon className="w-full h-full" /></div><span className="truncate min-w-0">My Attendance</span></NavLink>
                <NavLink to="/teacher/apply-leave" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><FileTextIcon className="w-full h-full" /></div><span className="truncate min-w-0">Apply for Leave</span></NavLink>
                <NavLink to="/teacher/students" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><UsersIcon className="w-full h-full" /></div><span className="truncate min-w-0">Students</span></NavLink>
                {user?.enabledFeatures?.teacher_syllabus && <NavLink to="/teacher/syllabus" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><BookOpenIcon className="w-full h-full" /></div><span className="truncate min-w-0">Syllabus</span></NavLink>}
                {user?.enabledFeatures?.teacher_gradebook && <NavLink to="/teacher/gradebook" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><AcademicsIcon className="w-full h-full" /></div><span className="truncate min-w-0">Gradebook</span></NavLink>}
                <NavLink to="/teacher/exam-marks" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><AcademicsIcon className="w-full h-full" /></div><span className="truncate min-w-0">Exam Marks</span></NavLink>
                <NavLink to="/teacher/homework" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><FileTextIcon className="w-full h-full" /></div><span className="truncate min-w-0">Homework</span></NavLink>
                {user?.enabledFeatures?.teacher_quizzes && <NavLink to="/teacher/quizzes" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><ClipboardListIcon className="w-full h-full" /></div><span className="truncate min-w-0">Quizzes</span></NavLink>}
                {user?.enabledFeatures?.teacher_content && <NavLink to="/teacher/content" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><BookOpenIcon className="w-full h-full" /></div><span className="truncate min-w-0">Content</span></NavLink>}
                <NavLink to="/teacher/meetings" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><CalendarCheckIcon className="w-full h-full" /></div><span className="truncate min-w-0">Meeting Requests</span></NavLink>
                <NavLink to="/teacher/library" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><BookOpenIcon className="w-full h-full" /></div><span className="truncate min-w-0">Library</span></NavLink>
                <NavLink to="/teacher/events" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><CalendarIcon className="w-full h-full" /></div><span className="truncate min-w-0">Events</span></NavLink>
            </nav>
            <div className="mt-auto">
                <button
                    onClick={onOpenProfile}
                    className="w-full text-left px-4 py-3 mb-2 border-t border-slate-700 hover:bg-slate-700 rounded-lg transition-colors focus:outline-none"
                    aria-label="Open user profile modal"
                >
                    <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.role} ({user?.schoolName})</p>
                </button>
                <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-300 hover:bg-red-800 hover:text-white rounded-lg transition-colors duration-200">
                    <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><LogoutIcon className="w-full h-full" /></div>
                    <span className="truncate min-w-0">Logout</span>
                </button>
            </div>
        </aside>
    );
};

const TeacherPortal: React.FC = () => {
    const { user } = useAuth();
    const { triggerRefresh } = useDataRefresh();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);

    const handleProfileSave = () => {
        setProfileModalOpen(false);
        triggerRefresh();
    };

    return (
        <div className="flex h-screen bg-background-dark text-text-primary-dark">
            <div className="hidden lg:flex lg:flex-shrink-0">
                <TeacherSidebarContent onOpenProfile={() => setProfileModalOpen(true)} />
            </div>

            {isSidebarOpen && (
                <div className="fixed inset-0 z-40 flex lg:hidden" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-black bg-opacity-25" aria-hidden="true" onClick={() => setIsSidebarOpen(false)}></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full">
                        <TeacherSidebarContent onClose={() => setIsSidebarOpen(false)} onOpenProfile={() => { setIsSidebarOpen(false); setProfileModalOpen(true); }}/>
                    </div>
                </div>
            )}
            
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <button className="lg:hidden mb-4 text-text-secondary-dark" onClick={() => setIsSidebarOpen(!isSidebarOpen)} aria-label="Toggle menu">
                    {isSidebarOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                </button>
                <Routes>
                    <Route path="dashboard" element={<TeacherDashboard />} />
                    <Route path="attendance" element={<AttendanceManagement />} />
                    <Route path="my-attendance" element={<MyAttendance />} />
                    <Route path="apply-leave" element={<ApplyForLeave />} />
                    <Route path="gradebook" element={<Gradebook />} />
                    <Route path="students" element={<StudentInformation />} />
                    <Route path="syllabus" element={<SyllabusManagement />} />
                    <Route path="content" element={<ContentManagement />} />
                    <Route path="quizzes" element={<MyQuizzes />} />
                    <Route path="create-test/:quizId" element={<CreateTest />} />
                    <Route path="view-test/:quizId" element={<ViewTest />} />
                    <Route path="homework" element={<HomeworkHistory />} />
                    <Route path="meetings" element={<MeetingRequests />} />
                    <Route path="library" element={<Library />} />
                    <Route path="events" element={<Events />} />
                    <Route path="exam-marks" element={<ExamMarksEntry />} />
                </Routes>
            </main>
            {user && isProfileModalOpen && (
                <UserProfileModal
                    isOpen={isProfileModalOpen}
                    onClose={() => setProfileModalOpen(false)}
                    onSave={handleProfileSave}
                    user={user}
                />
            )}
        </div>
    );
};

export default TeacherPortal;