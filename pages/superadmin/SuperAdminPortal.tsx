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
    Settings2Icon,
    MenuIcon,
    XIcon,
    BanknoteIcon
} from '../../components/icons/Icons.tsx';

// Re-use Admin Pages for feature parity
import AdminDashboard from '../admin/AdminDashboard.tsx';
import SchoolManagement from '../admin/SchoolManagement.tsx';
import RegistrationRequests from '../admin/RegistrationRequests.tsx';
import UserManagement from '../admin/UserManagement.tsx';
import FinanceManagement from '../admin/FinanceManagement.tsx';
import Analytics from '../admin/Analytics.tsx';
import InfrastructureOversight from '../admin/InfrastructureOversight.tsx';
import CommunicationHub from '../admin/CommunicationHub.tsx';

// New SuperAdmin exclusive pages
import MasterConfiguration from './MasterConfiguration.tsx';
import ErpPayments from './ErpPayments.tsx';
import UserProfileModal from '../../components/modals/UserProfileModal.tsx';
import { useDataRefresh } from '../../contexts/DataRefreshContext.tsx';


const SuperAdminSidebarContent: React.FC<{ onClose?: () => void, onOpenProfile: () => void }> = ({ onClose, onOpenProfile }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    
    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 overflow-hidden ${
        isActive ? 'bg-amber-500 text-slate-900' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        }`;

    return (
        <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col p-4 border-r border-slate-700 h-full">
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
            <div className="text-center mb-4 p-2 bg-slate-800 rounded-lg">
                <p className="text-sm font-semibold text-amber-400">Super Admin Portal</p>
            </div>
            <nav className="flex-1 space-y-2 overflow-y-auto">
                <NavLink to="/superadmin/dashboard" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><DashboardIcon className="w-full h-full" /></div><span className="truncate min-w-0">Dashboard</span></NavLink>
                <NavLink to="/superadmin/schools" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><BranchIcon className="w-full h-full" /></div><span className="truncate min-w-0">School Management</span></NavLink>
                <NavLink to="/superadmin/requests" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><RequestsIcon className="w-full h-full" /></div><span className="truncate min-w-0">Registration Requests</span></NavLink>
                <NavLink to="/superadmin/users" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><UsersIcon className="w-full h-full" /></div><span className="truncate min-w-0">User Management</span></NavLink>
                <NavLink to="/superadmin/finance" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><FinanceIcon className="w-full h-full" /></div><span className="truncate min-w-0">Finance & Fees</span></NavLink>
                <NavLink to="/superadmin/analytics" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><ReportsIcon className="w-full h-full" /></div><span className="truncate min-w-0">Analytics & Reporting</span></NavLink>
                <NavLink to="/superadmin/infrastructure" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><BusIcon className="w-full h-full" /></div><span className="truncate min-w-0">Infrastructure</span></NavLink>
                <NavLink to="/superadmin/communication" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><CommunicationIcon className="w-full h-full" /></div><span className="truncate min-w-0">Communication Hub</span></NavLink>
                <NavLink to="/superadmin/erp-payments" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><BanknoteIcon className="w-full h-full" /></div><span className="truncate min-w-0">ERP Payments</span></NavLink>
                <NavLink to="/superadmin/master-config" className={navLinkClasses}><div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><Settings2Icon className="w-full h-full" /></div><span className="truncate min-w-0">Master Configuration</span></NavLink>
            </nav>
            <div className="mt-auto">
                <button
                    onClick={onOpenProfile}
                    className="w-full text-left px-4 py-3 mb-2 border-t border-slate-700 hover:bg-slate-700 rounded-lg transition-colors focus:outline-none"
                    aria-label="Open user profile modal"
                >
                    <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-amber-400">{user?.role}</p>
                </button>
                <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-300 hover:bg-red-800 hover:text-white rounded-lg transition-colors duration-200">
                    <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0"><LogoutIcon className="w-full h-full" /></div>
                    <span className="truncate min-w-0">Logout</span>
                </button>
            </div>
        </aside>
    );
};

const SuperAdminPortal: React.FC = () => {
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
                <SuperAdminSidebarContent onOpenProfile={() => setProfileModalOpen(true)} />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-40 flex lg:hidden" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-black bg-opacity-25" aria-hidden="true" onClick={() => setIsSidebarOpen(false)}></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full">
                        <SuperAdminSidebarContent onClose={() => setIsSidebarOpen(false)} onOpenProfile={() => { setIsSidebarOpen(false); setProfileModalOpen(true); }} />
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
                    <Route path="users" element={<UserManagement />} />
                    <Route path="finance" element={<FinanceManagement />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="infrastructure" element={<InfrastructureOversight />} />
                    <Route path="communication" element={<CommunicationHub />} />
                    <Route path="erp-payments" element={<ErpPayments />} />
                    <Route path="master-config" element={<MasterConfiguration />} />
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

export default SuperAdminPortal;