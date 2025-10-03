// pages/admin/AdminPortal.tsx
import React, { useState } from 'react';
// FIX: Corrected react-router-dom imports for v6+
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.ts';
import { 
    DashboardIcon, 
    BranchIcon, 
    RequestsIcon, 
    LogoutIcon, 
    VerticxLogo,
    UsersIcon,
    FinanceIcon,
    ReportsIcon,
    BusIcon,
    CommunicationIcon,
    SettingsIcon,
    MenuIcon,
    XIcon,
    HelpCircleIcon
} from '../../components/icons/Icons.tsx';

// Admin Pages
import AdminDashboard from './AdminDashboard.tsx';
import SchoolManagement from './SchoolManagement.tsx';
import RegistrationRequests from './RegistrationRequests.tsx';
import UserManagement from './UserManagement.tsx';
import FinanceManagement from './FinanceManagement.tsx';
import Analytics from './Analytics.tsx';
import InfrastructureOversight from './InfrastructureOversight.tsx';
import CommunicationHub from './CommunicationHub.tsx';
import SystemManagement from './SystemManagement.tsx';
import PrincipalQueries from './PrincipalQueries.tsx';
import UserProfileModal from '../../components/modals/UserProfileModal.tsx';
import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';


const AdminSidebarContent: React.FC<{ onClose?: () => void, onOpenProfile: () => void }> = ({ onClose, onOpenProfile }) => {
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
            <nav className="flex-1 space-y-2 overflow-y-auto">
                <NavLink to="/admin/dashboard" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><DashboardIcon className="w-full h-full" /></div><span className="truncate min-w-0">Dashboard</span></NavLink>
                <NavLink to="/admin/schools" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><BranchIcon className="w-full h-full" /></div><span className="truncate min-w-0">School Management</span></NavLink>
                <NavLink to="/admin/requests" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><RequestsIcon className="w-full h-full" /></div><span className="truncate min-w-0">Registration Requests</span></NavLink>
                <NavLink to="/admin/principal-queries" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><HelpCircleIcon className="w-full h-full" /></div><span className="truncate min-w-0">Principal Queries</span></NavLink>
                <NavLink to="/admin/users" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><UsersIcon className="w-full h-full" /></div><span className="truncate min-w-0">User Management</span></NavLink>
                <NavLink to="/admin/finance" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><FinanceIcon className="w-full h-full" /></div><span className="truncate min-w-0">Finance & Fees</span></NavLink>
                <NavLink to="/admin/analytics" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><ReportsIcon className="w-full h-full" /></div><span className="truncate min-w-0">Analytics & Reporting</span></NavLink>
                <NavLink to="/admin/infrastructure" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><BusIcon className="w-full h-full" /></div><span className="truncate min-w-0">Infrastructure</span></NavLink>
                <NavLink to="/admin/communication" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><CommunicationIcon className="w-full h-full" /></div><span className="truncate min-w-0">Communication Hub</span></NavLink>
                <NavLink to="/admin/system" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><SettingsIcon className="w-full h-full" /></div><span className="truncate min-w-0">System & Security</span></NavLink>
            </nav>
            <div className="mt-auto">
                <button
                    onClick={onOpenProfile}
                    className="w-full text-left px-4 py-3 mb-2 border-t border-slate-700 hover:bg-slate-700 rounded-lg transition-colors focus:outline-none"
                    aria-label="Open user profile modal"
                >
                    <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400">{user?.role}</p>
                </button>
                <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-300 hover:bg-red-800 hover:text-white rounded-lg transition-colors duration-200">
                    <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><LogoutIcon className="w-full h-full" /></div>
                    <span className="truncate min-w-0">Logout</span>
                </button>
            </div>
        </aside>
    );
};

const AdminPortal: React.FC = () => {
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
                <AdminSidebarContent onOpenProfile={() => setProfileModalOpen(true)} />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-40 flex lg:hidden" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-black bg-opacity-25" aria-hidden="true" onClick={() => setIsSidebarOpen(false)}></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full">
                        <AdminSidebarContent onClose={() => setIsSidebarOpen(false)} onOpenProfile={() => { setIsSidebarOpen(false); setProfileModalOpen(true); }} />
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
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="schools" element={<SchoolManagement />} />
                    <Route path="requests" element={<RegistrationRequests />} />
                    <Route path="principal-queries" element={<PrincipalQueries />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="finance" element={<FinanceManagement />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="infrastructure" element={<InfrastructureOversight />} />
                    <Route path="communication" element={<CommunicationHub />} />
                    <Route path="system" element={<SystemManagement />} />
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

export default AdminPortal;