import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.ts';
import { 
    DashboardIcon, UsersIcon, TeachersIcon, LogoutIcon, VerticxLogo, AcademicsIcon,
    FinanceIcon, ReportsIcon, CommunicationIcon, RequestsIcon, MenuIcon, XIcon,
    ClipboardListIcon, AlertTriangleIcon, EventsIcon, AttendanceIcon, SettingsIcon
} from '../../components/icons/Icons.tsx';

// Eager load Principal Pages
import PrincipalDashboard from './PrincipalDashboard.tsx';
import StudentManagement from './StudentManagement.tsx';
import FacultyManagement from './FacultyManagement.tsx';
import ClassView from './ClassView.tsx';
import FinancialOverview from './FinancialOverview.tsx';
import AttendanceOverview from './AttendanceOverview.tsx';
import Reports from './Reports.tsx';
import Communication from './Communication.tsx';
import GrievanceDiscipline from './GrievanceDiscipline.tsx';
import GrievanceOverview from './GrievanceOverview.tsx';
import EventManagement from './EventManagement.tsx';
import ExaminationResults from './ExaminationResults.tsx';
// FIX: Changed import to be a named import as the export was changed to named.
import { SchoolProfile } from './SchoolProfile.tsx';
import StaffRequests from './StaffRequests.tsx';


const PrincipalSidebarContent: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
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
          <NavLink to="/principal/dashboard" className={navLinkClasses}>
            <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
              <DashboardIcon className="w-full h-full" />
            </div>
            <span className="truncate min-w-0">Dashboard</span>
          </NavLink>
          {user?.enabledFeatures?.principal_students && (
            <NavLink to="/principal/students" className={navLinkClasses}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                <UsersIcon className="w-full h-full" />
              </div>
              <span className="truncate min-w-0">Students</span>
            </NavLink>
          )}
          {user?.enabledFeatures?.principal_faculty && (
            <NavLink to="/principal/faculty" className={navLinkClasses}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                <TeachersIcon className="w-full h-full" />
              </div>
              <span className="truncate min-w-0">Faculty</span>
            </NavLink>
          )}
          {user?.enabledFeatures?.principal_classes && (
            <NavLink to="/principal/classes" className={navLinkClasses}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                <AcademicsIcon className="w-full h-full" />
              </div>
              <span className="truncate min-w-0">Classes</span>
            </NavLink>
          )}
          {user?.enabledFeatures?.principal_finance && (
            <NavLink to="/principal/finance" className={navLinkClasses}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                <FinanceIcon className="w-full h-full" />
              </div>
              <span className="truncate min-w-0">Finance</span>
            </NavLink>
          )}
          {user?.enabledFeatures?.principal_attendance && (
            <NavLink to="/principal/attendance" className={navLinkClasses}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                <AttendanceIcon className="w-full h-full" />
              </div>
              <span className="truncate min-w-0">Attendance</span>
            </NavLink>
          )}
          {user?.enabledFeatures?.principal_results && (
            <NavLink to="/principal/results" className={navLinkClasses}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                <ClipboardListIcon className="w-full h-full" />
              </div>
              <span className="truncate min-w-0">Results</span>
            </NavLink>
          )}
          {user?.enabledFeatures?.principal_staff_requests && (
            <NavLink to="/principal/staff-requests" className={navLinkClasses}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                <RequestsIcon className="w-full h-full" />
              </div>
              <span className="truncate min-w-0">Staff Requests</span>
            </NavLink>
          )}
          {user?.enabledFeatures?.principal_grievances && (
            <NavLink to="/principal/grievances" className={navLinkClasses}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                <AlertTriangleIcon className="w-full h-full" />
              </div>
              <span className="truncate min-w-0">Grievance Log</span>
            </NavLink>
          )}
          {user?.enabledFeatures?.principal_complaints && (
            <NavLink to="/principal/raise-complaint" className={navLinkClasses}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                <ClipboardListIcon className="w-full h-full" />
              </div>
              <span className="truncate min-w-0">Raise Complaint</span>
            </NavLink>
          )}
          {user?.enabledFeatures?.principal_events && (
            <NavLink to="/principal/events" className={navLinkClasses}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                <EventsIcon className="w-full h-full" />
              </div>
              <span className="truncate min-w-0">Events</span>
            </NavLink>
          )}
          {user?.enabledFeatures?.principal_communication && (
            <NavLink to="/principal/communication" className={navLinkClasses}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                <CommunicationIcon className="w-full h-full" />
              </div>
              <span className="truncate min-w-0">Communication</span>
            </NavLink>
          )}
          {user?.enabledFeatures?.principal_reports && (
            <NavLink to="/principal/reports" className={navLinkClasses}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                <ReportsIcon className="w-full h-full" />
              </div>
              <span className="truncate min-w-0">Reports</span>
            </NavLink>
          )}
          {user?.enabledFeatures?.principal_profile && (
            <NavLink to="/principal/profile" className={navLinkClasses}>
              <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                <SettingsIcon className="w-full h-full" />
              </div>
              <span className="truncate min-w-0">School Profile</span>
            </NavLink>
          )}
        </nav>
        <div className="mt-auto">
          <div className="px-4 py-3 mb-2 border-t border-slate-700">
            <p className="text-sm font-semibold text-white truncate">
              {user?.name}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {user?.role} ({user?.schoolName})
            </p>
          </div>
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

const PrincipalPortal: React.FC = () => {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background-dark text-text-primary-dark">
            <div className="hidden lg:flex lg:flex-shrink-0">
                <PrincipalSidebarContent />
            </div>

            {isSidebarOpen && (
                <div className="fixed inset-0 z-40 flex lg:hidden" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-black bg-opacity-25" aria-hidden="true" onClick={() => setIsSidebarOpen(false)}></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full">
                        <PrincipalSidebarContent onClose={() => setIsSidebarOpen(false)} />
                    </div>
                </div>
            )}
            
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <button className="lg:hidden mb-4 text-text-secondary-dark" onClick={() => setIsSidebarOpen(!isSidebarOpen)} aria-label="Toggle menu">
                    {isSidebarOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                </button>
                <Routes>
                    <Route path="dashboard" element={<PrincipalDashboard />} />
                    {user?.enabledFeatures?.principal_students && <Route path="students" element={<StudentManagement />} />}
                    {user?.enabledFeatures?.principal_faculty && <Route path="faculty" element={<FacultyManagement />} />}
                    {user?.enabledFeatures?.principal_classes && <Route path="classes" element={<ClassView />} />}
                    {user?.enabledFeatures?.principal_finance && <Route path="finance" element={<FinancialOverview />} />}
                    {user?.enabledFeatures?.principal_attendance && <Route path="attendance" element={<AttendanceOverview />} />}
                    {user?.enabledFeatures?.principal_results && <Route path="results" element={<ExaminationResults />} />}
                    {user?.enabledFeatures?.principal_staff_requests && <Route path="staff-requests" element={<StaffRequests />} />}
                    {user?.enabledFeatures?.principal_grievances && <Route path="grievances" element={<GrievanceOverview />} />}
                    {user?.enabledFeatures?.principal_complaints && <Route path="raise-complaint" element={<GrievanceDiscipline />} />}
                    {user?.enabledFeatures?.principal_events && <Route path="events" element={<EventManagement />} />}
                    {user?.enabledFeatures?.principal_communication && <Route path="communication" element={<Communication />} />}
                    {user?.enabledFeatures?.principal_reports && <Route path="reports" element={<Reports />} />}
                    {user?.enabledFeatures?.principal_profile && <Route path="profile" element={<SchoolProfile />} />}
                </Routes>
            </main>
        </div>
    );
};

export default PrincipalPortal;