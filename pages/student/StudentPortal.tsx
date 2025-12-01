import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.ts';
import { 
    DashboardIcon, LogoutIcon, VerticxLogo, AcademicsIcon,
    FileTextIcon, MenuIcon, XIcon,
    ClipboardListIcon, BookOpenIcon,
    LibraryIcon, CalendarIcon, FeedbackIcon, AlertTriangleIcon, AttendanceIcon,
    FileWarningIcon
} from '../../components/icons/Icons.tsx';

// Student Pages
import StudentDashboard from './StudentDashboard.tsx';
import Assignments from './Assignments.tsx';
import MyGrades from './MyGrades.tsx';
import MyAttendance from './MyAttendance.tsx';
import SyllabusView from './SyllabusView.tsx';
import StudentContent from './StudentContent.tsx';
import QuizList from './QuizList.tsx';
import AttendQuiz from './AttendQuiz.tsx';
import Library from './Library.tsx';
import Events from './Events.tsx';
import TeacherFeedback from './TeacherFeedback.tsx';
import MyComplaints from './MyComplaints.tsx';
import RaisedComplaints from './RaisedComplaints.tsx';
import DisciplineLog from './DisciplineLog.tsx';
import ApplyForLeave from './ApplyForLeave.tsx';
import UserProfileModal from '../../components/modals/UserProfileModal.tsx';
import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';


const StudentSidebarContent: React.FC<{ onClose?: () => void, onOpenProfile: () => void }> = ({ onClose, onOpenProfile }) => {
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
            {/* <div className="w-8 h-8 mr-3 flex-shrink-0">
              <VerticxLogo className="w-full h-full" />
            </div>
            <span className="text-xl font-bold text-white truncate min-w-0">
              VERTICX
            </span> */}
            <span className="text-xl font-bold text-white truncate min-w-0">
              {user?.schoolName}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-slate-300 hover:text-white"
            >
              <XIcon className="w-6 h-6" />
            </button>
          )}
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
          <NavLink to="/student/dashboard" className={navLinkClasses}>
            <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
              <DashboardIcon className="w-full h-full" />
            </div>
            <span className="truncate min-w-0">Dashboard</span>
          </NavLink>
          {user?.enabledFeatures?.student_syllabus && (
            <NavLink to="/student/syllabus" className={navLinkClasses}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                <BookOpenIcon className="w-full h-full" />
              </div>
              <span className="truncate min-w-0">Syllabus</span>
            </NavLink>
          )}
          {user?.enabledFeatures?.student_content && (
            <NavLink to="/student/content" className={navLinkClasses}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                <BookOpenIcon className="w-full h-full" />
              </div>
              <span className="truncate min-w-0">Content</span>
            </NavLink>
          )}
          {user?.enabledFeatures?.student_assignments && (
            <NavLink to="/student/assignments" className={navLinkClasses}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                <FileTextIcon className="w-full h-full" />
              </div>
              <span className="truncate min-w-0">Assignments</span>
            </NavLink>
          )}
          {user?.enabledFeatures?.student_grades && (
            <NavLink to="/student/grades" className={navLinkClasses}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                <AcademicsIcon className="w-full h-full" />
              </div>
              <span className="truncate min-w-0">My Grades</span>
            </NavLink>
          )}
          <NavLink to="/student/quizzes" className={navLinkClasses}>
            <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
              <ClipboardListIcon className="w-full h-full" />
            </div>
            <span className="truncate min-w-0">Quizzes</span>
          </NavLink>
          {user?.enabledFeatures?.student_attendance && (
            <NavLink to="/student/attendance" className={navLinkClasses}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                <AttendanceIcon className="w-full h-full" />
              </div>
              <span className="truncate min-w-0">My Attendance</span>
            </NavLink>
          )}
          <NavLink to="/student/apply-leave" className={navLinkClasses}>
            <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
              <FileTextIcon className="w-full h-full" />
            </div>
            <span className="truncate min-w-0">Apply for Leave</span>
          </NavLink>
          <NavLink to="/student/library" className={navLinkClasses}>
            <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
              <LibraryIcon className="w-full h-full" />
            </div>
            <span className="truncate min-w-0">Library</span>
          </NavLink>
          <NavLink to="/student/events" className={navLinkClasses}>
            <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
              <CalendarIcon className="w-full h-full" />
            </div>
            <span className="truncate min-w-0">Events</span>
          </NavLink>
          {user?.enabledFeatures?.student_feedback && (
            <NavLink to="/student/feedback" className={navLinkClasses}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                <FeedbackIcon className="w-full h-full" />
              </div>
              <span className="truncate min-w-0">Teacher Feedback</span>
            </NavLink>
          )}
          {user?.enabledFeatures?.student_complaints && (
            <NavLink to="/student/my-complaints" className={navLinkClasses}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                <FileWarningIcon className="w-full h-full" />
              </div>
              <span className="truncate min-w-0">My Complaints</span>
            </NavLink>
          )}
          <NavLink to="/student/discipline" className={navLinkClasses}>
            <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
              <AlertTriangleIcon className="w-full h-full" />
            </div>
            <span className="truncate min-w-0">Discipline Log</span>
          </NavLink>
        </nav>
        <div className="mt-auto">
          <button
            onClick={onOpenProfile}
            className="w-full text-left px-4 py-3 mb-2 border-t border-slate-700 hover:bg-slate-700 rounded-lg transition-colors focus:outline-none"
            aria-label="Open user profile modal"
          >
            <p className="text-sm font-semibold text-white truncate">
              {user?.name}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {user?.role} ({user?.schoolName})
            </p>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-300 hover:bg-red-800 hover:text-white rounded-lg transition-colors duration-200"
          >
            <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
              <LogoutIcon className="w-full h-full" />
            </div>
            <span className="truncate min-w-0">Logout</span>
          </button>
        </div>
      </aside>
    );
};

const StudentPortal: React.FC = () => {
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
                <StudentSidebarContent onOpenProfile={() => setProfileModalOpen(true)} />
            </div>

            {isSidebarOpen && (
                <div className="fixed inset-0 z-40 flex lg:hidden" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-black bg-opacity-25" aria-hidden="true" onClick={() => setIsSidebarOpen(false)}></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full">
                        <StudentSidebarContent onClose={() => setIsSidebarOpen(false)} onOpenProfile={() => { setIsSidebarOpen(false); setProfileModalOpen(true); }}/>
                    </div>
                </div>
            )}
            
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <button className="lg:hidden mb-4 text-text-secondary-dark" onClick={() => setIsSidebarOpen(!isSidebarOpen)} aria-label="Toggle menu">
                    {isSidebarOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                </button>
                <Routes>
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="assignments" element={<Assignments />} />
                    <Route path="grades" element={<MyGrades />} />
                    <Route path="attendance" element={<MyAttendance />} />
                    <Route path="apply-leave" element={<ApplyForLeave />} />
                    <Route path="syllabus" element={<SyllabusView />} />
                    <Route path="content" element={<StudentContent />} />
                    <Route path="quizzes" element={<QuizList />} />
                    <Route path="quiz/:studentQuizId" element={<AttendQuiz />} />
                    <Route path="library" element={<Library />} />
                    <Route path="events" element={<Events />} />
                    <Route path="feedback" element={<TeacherFeedback />} />
                    <Route path="my-complaints" element={<RaisedComplaints />} />
                    <Route path="discipline" element={<DisciplineLog />} />
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

export default StudentPortal;