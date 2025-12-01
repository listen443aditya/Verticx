import React, { useState } from 'react';
// FIX: Corrected react-router-dom imports for v6+
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.ts';
import { 
    DashboardIcon, 
    LogoutIcon, 
    VerticxLogo,
    LibraryIcon,
    MoveIcon,
    MenuIcon,
    XIcon,
    AttendanceIcon,
    FileTextIcon
} from '../../components/icons/Icons.tsx';
import UserProfileModal from '../../components/modals/UserProfileModal.tsx';
import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';

// Librarian Pages
import LibrarianDashboard from './LibrarianDashboard.tsx';
import BookManagement from './BookManagement.tsx';
import IssuanceManagement from './IssuanceManagement.tsx';
import MyAttendance from './MyAttendance.tsx';
import ApplyForLeave from './ApplyForLeave.tsx';

const LibrarianSidebarContent: React.FC<{ onClose?: () => void, onOpenProfile: () => void }> = ({ onClose, onOpenProfile }) => {
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
                    <span className="text-xl font-bold text-white truncate min-w-0">VERTICX</span> */}
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
        <nav className="flex-1 space-y-2">
          <NavLink to="/librarian/dashboard" className={navLinkClasses}>
            <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
              <DashboardIcon className="w-full h-full" />
            </div>
            <span className="truncate min-w-0">Dashboard</span>
          </NavLink>
          <NavLink to="/librarian/books" className={navLinkClasses}>
            <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
              <LibraryIcon className="w-full h-full" />
            </div>
            <span className="truncate min-w-0">Book Catalog</span>
          </NavLink>
          <NavLink to="/librarian/issuance" className={navLinkClasses}>
            <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
              <MoveIcon className="w-full h-full" />
            </div>
            <span className="truncate min-w-0">Issue & Returns</span>
          </NavLink>
          <NavLink to="/librarian/my-attendance" className={navLinkClasses}>
            <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
              <AttendanceIcon className="w-full h-full" />
            </div>
            <span className="truncate min-w-0">My Attendance</span>
          </NavLink>
          <NavLink to="/librarian/apply-leave" className={navLinkClasses}>
            <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
              <FileTextIcon className="w-full h-full" />
            </div>
            <span className="truncate min-w-0">Apply for Leave</span>
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

const LibrarianPortal: React.FC = () => {
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
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex lg:flex-shrink-0">
                <LibrarianSidebarContent onOpenProfile={() => setProfileModalOpen(true)} />
            </div>

            {/* Mobile Sidebar */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-40 flex lg:hidden" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-black bg-opacity-25" aria-hidden="true" onClick={() => setIsSidebarOpen(false)}></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full">
                        <LibrarianSidebarContent onClose={() => setIsSidebarOpen(false)} onOpenProfile={() => { setIsSidebarOpen(false); setProfileModalOpen(true); }}/>
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
                    <Route path="dashboard" element={<LibrarianDashboard />} />
                    <Route path="books" element={<BookManagement />} />
                    <Route path="issuance" element={<IssuanceManagement />} />
                    <Route path="my-attendance" element={<MyAttendance />} />
                    <Route path="apply-leave" element={<ApplyForLeave />} />
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

export default LibrarianPortal;