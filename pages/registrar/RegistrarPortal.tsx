import React, { useState } from 'react';
// FIX: Corrected react-router-dom imports for v6+
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.ts';
import { 
    DashboardIcon, 
    UsersIcon, 
    TeachersIcon, 
    LogoutIcon, 
    VerticxLogo, 
    AdmissionsIcon, 
    FeesIcon,
    TimetableIcon,
    MoveIcon,
    AcademicsIcon,
    InventoryIcon,
    DocumentsIcon,
    EventsIcon,
    HostelIcon,
    BusIcon,
    FileTextIcon,
    CommunicationIcon,
    RequestsIcon,
    MenuIcon,
    XIcon,
    ClipboardListIcon,
    AttendanceIcon
} from '../../components/icons/Icons.tsx';
import RegistrarDashboard from './RegistrarDashboard.tsx';
import AdmissionsManagement from './AdmissionsManagement.tsx';
import StudentInformationSystem from './StudentInformationSystem.tsx';
// FIX: Added default export for FacultyInformationSystem.
import FacultyInformationSystem from './FacultyInformationSystem.tsx';
import FeeManagement from './FeeManagement.tsx';
import TimetableManagement from './TimetableManagement.tsx';
import BulkStudentMovement from './BulkStudentMovement.tsx';
import ClassManagement from './ClassManagement.tsx';
import Inventory from './Inventory.tsx';
import DocumentManagement from './DocumentManagement.tsx';
import EventManagement from './EventManagement.tsx';
import HostelManagement from './HostelManagement.tsx';
import TransportManagement from './TransportManagement.tsx';
import Reports from './Reports.tsx';
import Communication from './Communication.tsx';
import AcademicRequests from './AcademicRequests.tsx';
import ExaminationManagement from './ExaminationManagement.tsx';
import AttendanceMonitoring from './AttendanceMonitoring.tsx';
import UserProfileModal from '../../components/modals/UserProfileModal.tsx';
import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';


const RegistrarSidebarContent: React.FC<{ onClose?: () => void, onOpenProfile: () => void }> = ({ onClose, onOpenProfile }) => {
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
                <NavLink to="/registrar/dashboard" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><DashboardIcon className="w-full h-full" /></div><span className="truncate min-w-0">Dashboard</span></NavLink>
                {user?.enabledFeatures?.registrar_admissions && <NavLink to="/registrar/admissions" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><AdmissionsIcon className="w-full h-full" /></div><span className="truncate min-w-0">Admissions</span></NavLink>}
                {user?.enabledFeatures?.registrar_academic_requests && <NavLink to="/registrar/academic-requests" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><RequestsIcon className="w-full h-full" /></div><span className="truncate min-w-0">Academic Requests</span></NavLink>}
                {user?.enabledFeatures?.registrar_students && <NavLink to="/registrar/students" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><UsersIcon className="w-full h-full" /></div><span className="truncate min-w-0">Students</span></NavLink>}
                {user?.enabledFeatures?.registrar_faculty && <NavLink to="/registrar/faculty" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><TeachersIcon className="w-full h-full" /></div><span className="truncate min-w-0">Faculty</span></NavLink>}
                {user?.enabledFeatures?.registrar_classes && <NavLink to="/registrar/classes" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><AcademicsIcon className="w-full h-full" /></div><span className="truncate min-w-0">Classes</span></NavLink>}
                {user?.enabledFeatures?.registrar_fees && <NavLink to="/registrar/fees" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><FeesIcon className="w-full h-full" /></div><span className="truncate min-w-0">Fees & Finance</span></NavLink>}
                {user?.enabledFeatures?.registrar_timetable && <NavLink to="/registrar/timetable" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><TimetableIcon className="w-full h-full" /></div><span className="truncate min-w-0">Timetable</span></NavLink>}
                
                {user?.enabledFeatures?.registrar_attendance && <NavLink to="/registrar/attendance" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><AttendanceIcon className="w-full h-full" /></div><span className="truncate min-w-0">Attendance</span></NavLink>}
                
                <NavLink to="/registrar/examinations" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><ClipboardListIcon className="w-full h-full" /></div><span className="truncate min-w-0">Examinations</span></NavLink>
                {user?.enabledFeatures?.registrar_hostel && <NavLink to="/registrar/hostel" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><HostelIcon className="w-full h-full" /></div><span className="truncate min-w-0">Hostel</span></NavLink>}
                {user?.enabledFeatures?.registrar_transport && <NavLink to="/registrar/transport" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><BusIcon className="w-full h-full" /></div><span className="truncate min-w-0">Transport</span></NavLink>}
                {user?.enabledFeatures?.registrar_inventory && <NavLink to="/registrar/inventory" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><InventoryIcon className="w-full h-full" /></div><span className="truncate min-w-0">Inventory</span></NavLink>}
                {user?.enabledFeatures?.registrar_documents && <NavLink to="/registrar/documents" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><DocumentsIcon className="w-full h-full" /></div><span className="truncate min-w-0">Documents</span></NavLink>}
                {user?.enabledFeatures?.registrar_events && <NavLink to="/registrar/events" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><EventsIcon className="w-full h-full" /></div><span className="truncate min-w-0">Events</span></NavLink>}
                {user?.enabledFeatures?.registrar_reports && <NavLink to="/registrar/reports" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><FileTextIcon className="w-full h-full" /></div><span className="truncate min-w-0">Reports</span></NavLink>}
                {user?.enabledFeatures?.registrar_communication && <NavLink to="/registrar/communication" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><CommunicationIcon className="w-full h-full" /></div><span className="truncate min-w-0">Communication</span></NavLink>}
                {user?.enabledFeatures?.registrar_bulk_movement && <NavLink to="/registrar/bulk-movement" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><MoveIcon className="w-full h-full" /></div><span className="truncate min-w-0">Bulk Movement</span></NavLink>}
            </nav>
            <div className="mt-auto">
                <button
                    onClick={onOpenProfile}
                    className="w-full text-left px-4 py-3 mb-2 border-t border-slate-700 hover:bg-slate-700 rounded-lg transition-colors focus:outline-none"
                    aria-label="Open user profile modal"
                >
                    <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.role} ({user?.schoolName || 'Registrar Portal'})</p>
                </button>
                <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-300 hover:bg-red-800 hover:text-white rounded-lg transition-colors duration-200">
                    <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><LogoutIcon className="w-full h-full" /></div>
                    <span className="truncate min-w-0">Logout</span>
                </button>
            </div>
        </aside>
    );
};

const RegistrarPortal: React.FC = () => {
    const { user } = useAuth();
    const { triggerRefresh } = useDataRefresh();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const handleProfileSave = () => {
        setIsProfileModalOpen(false);
        triggerRefresh();
    };

    return (
        <div className="flex h-screen bg-background-dark text-text-primary-dark">
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex lg:flex-shrink-0">
                <RegistrarSidebarContent onOpenProfile={() => setIsProfileModalOpen(true)} />
            </div>

            {/* Mobile Sidebar */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-40 flex lg:hidden" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-black bg-opacity-25" aria-hidden="true" onClick={() => setIsSidebarOpen(false)}></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full">
                        <RegistrarSidebarContent onClose={() => setIsSidebarOpen(false)} onOpenProfile={() => { setIsSidebarOpen(false); setIsProfileModalOpen(true); }} />
                    </div>
                </div>
            )}
            
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <button
                    className="lg:hidden mb-4 text-text-secondary-dark"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    aria-label="Toggle menu"
                >
                    {isSidebarOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                </button>
                <Routes>
                    <Route path="dashboard" element={<RegistrarDashboard />} />
                    {user?.enabledFeatures?.registrar_admissions && <Route path="admissions" element={<AdmissionsManagement />} />}
                    {user?.enabledFeatures?.registrar_academic_requests && <Route path="academic-requests" element={<AcademicRequests />} />}
                    {user?.enabledFeatures?.registrar_students && <Route path="students" element={<StudentInformationSystem />} />}
                    {user?.enabledFeatures?.registrar_faculty && <Route path="faculty" element={<FacultyInformationSystem />} />}
                    {user?.enabledFeatures?.registrar_classes && <Route path="classes" element={<ClassManagement />} />}
                    {user?.enabledFeatures?.registrar_fees && <Route path="fees" element={<FeeManagement />} />}
                    {user?.enabledFeatures?.registrar_timetable && <Route path="timetable" element={<TimetableManagement />} />}
                    {user?.enabledFeatures?.registrar_attendance && <Route path="attendance" element={<AttendanceMonitoring />} />}
                    <Route path="examinations" element={<ExaminationManagement />} />
                    {user?.enabledFeatures?.registrar_bulk_movement && <Route path="bulk-movement" element={<BulkStudentMovement />} />}
                    {user?.enabledFeatures?.registrar_inventory && <Route path="inventory" element={<Inventory />} />}
                    {user?.enabledFeatures?.registrar_documents && <Route path="documents" element={<DocumentManagement />} />}
                    {user?.enabledFeatures?.registrar_events && <Route path="events" element={<EventManagement />} />}
                    {user?.enabledFeatures?.registrar_hostel && <Route path="hostel" element={<HostelManagement />} />}
                    {user?.enabledFeatures?.registrar_transport && <Route path="transport" element={<TransportManagement />} />}
                    {user?.enabledFeatures?.registrar_reports && <Route path="reports" element={<Reports />} />}
                    {user?.enabledFeatures?.registrar_communication && <Route path="communication" element={<Communication />} />}
                </Routes>
            </main>
            
            {isProfileModalOpen && user && (
                <UserProfileModal
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    onSave={handleProfileSave}
                    user={user}
                />
            )}
        </div>
    );
};

export default RegistrarPortal;