import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.ts';
import { 
    DashboardIcon, LogoutIcon, VerticxLogo,
    CommunicationIcon, MenuIcon, XIcon,
    AlertTriangleIcon, CalendarIcon, BanknoteIcon, AcademicsIcon
} from '../../components/icons/Icons.tsx';
import UserProfileModal from '../../components/modals/UserProfileModal.tsx';
import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';

// Parent Pages
import ParentDashboard from './ParentDashboard.tsx';
import Complaints from './Complaints.tsx';
import ContactTeacher from './ContactTeacher.tsx';
import Events from './Events.tsx';
import FeeManagement from './FeeManagement.tsx';
import GradeBook from './GradeBook.tsx';

const ParentSidebarContent: React.FC<{ onClose?: () => void, onOpenProfile: () => void }> = ({ onClose, onOpenProfile }) => {
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
                <NavLink to="/parent/dashboard" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><DashboardIcon className="w-full h-full" /></div><span className="truncate min-w-0">Dashboard</span></NavLink>
                <NavLink to="/parent/grades" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><AcademicsIcon className="w-full h-full" /></div><span className="truncate min-w-0">Grade Book</span></NavLink>
                <NavLink to="/parent/fees" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><BanknoteIcon className="w-full h-full" /></div><span className="truncate min-w-0">Fee Management</span></NavLink>
                {user?.enabledFeatures?.parent_complaints && <NavLink to="/parent/complaints" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><AlertTriangleIcon className="w-full h-full" /></div><span className="truncate min-w-0">Complaints</span></NavLink>}
                {user?.enabledFeatures?.parent_contact_teacher && <NavLink to="/parent/contact" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><CommunicationIcon className="w-full h-full" /></div><span className="truncate min-w-0">Contact Teacher</span></NavLink>}
                <NavLink to="/parent/events" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><CalendarIcon className="w-full h-full" /></div><span className="truncate min-w-0">Events</span></NavLink>
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

const ParentPortal: React.FC = () => {
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
                <ParentSidebarContent onOpenProfile={() => setProfileModalOpen(true)} />
            </div>

            {isSidebarOpen && (
                <div className="fixed inset-0 z-40 flex lg:hidden" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-black bg-opacity-25" aria-hidden="true" onClick={() => setIsSidebarOpen(false)}></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full">
                        <ParentSidebarContent onClose={() => setIsSidebarOpen(false)} onOpenProfile={() => { setIsSidebarOpen(false); setProfileModalOpen(true); }}/>
                    </div>
                </div>
            )}
            
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <button className="lg:hidden mb-4 text-text-secondary-dark" onClick={() => setIsSidebarOpen(!isSidebarOpen)} aria-label="Toggle menu">
                    {isSidebarOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                </button>
                <Routes>
                    <Route path="dashboard" element={<ParentDashboard />} />
                    <Route path="grades" element={<GradeBook />} />
                    <Route path="fees" element={<FeeManagement />} />
                    <Route path="complaints" element={<Complaints />} />
                    <Route path="contact" element={<ContactTeacher />} />
                    <Route path="events" element={<Events />} />
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

export default ParentPortal;