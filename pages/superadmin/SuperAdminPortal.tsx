import React, { useState } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.ts";
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
  HelpCircleIcon,
  ShieldCheckIcon,
  FileCogIcon,
} from "../../components/icons/Icons.tsx";
import UserProfileModal from "../../components/modals/UserProfileModal.tsx";
import { useDataRefresh } from "../../contexts/DataRefreshContext.tsx";

// Import all the pages that will be routed within this portal
import AdminDashboard from "../admin/AdminDashboard.tsx";
import SchoolManagement from "../admin/SchoolManagement.tsx";
import RegistrationRequests from "../admin/RegistrationRequests.tsx";
import PrincipalQueries from "../admin/PrincipalQueries.tsx";
import UserManagement from "../admin/UserManagement.tsx";
import FinanceManagement from "../admin/FinanceManagement.tsx";
import Analytics from "../admin/Analytics.tsx";
import InfrastructureOversight from "../admin/InfrastructureOversight.tsx";
import CommunicationHub from "../admin/CommunicationHub.tsx";
import MasterConfiguration from "./MasterConfiguration.tsx";
import SystemManagement from "../admin/SystemManagement.tsx";

const SuperAdminSidebarContent: React.FC<{
  onClose?: () => void;
  onOpenProfile: () => void;
}> = ({ onClose, onOpenProfile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 overflow-hidden ${
      isActive
        ? "bg-brand-primary text-white"
        : "text-slate-300 hover:bg-slate-700 hover:text-white"
    }`;

  return (
    <aside className="w-64 bg-slate-800 text-slate-100 flex flex-col p-4 border-r border-slate-700 h-full">
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center overflow-hidden">
          <div className="w-8 h-8 mr-3 flex-shrink-0">
            <VerticxLogo className="w-full h-full" />
          </div>
          <span className="text-xl font-bold text-white truncate min-w-0">
            VERTICX
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
      <nav className="flex-1 space-y-2 overflow-y-auto">
        <NavLink to="/superadmin/dashboard" className={navLinkClasses}>
          <DashboardIcon className="w-4 h-4 mr-3" />
          Dashboard
        </NavLink>
        <NavLink to="/superadmin/schools" className={navLinkClasses}>
          <BranchIcon className="w-4 h-4 mr-3" />
          School Management
        </NavLink>
        <NavLink to="/superadmin/requests" className={navLinkClasses}>
          <RequestsIcon className="w-4 h-4 mr-3" />
          Registration Requests
        </NavLink>
        <NavLink to="/superadmin/principal-queries" className={navLinkClasses}>
          <HelpCircleIcon className="w-4 h-4 mr-3" />
          Principal Queries
        </NavLink>
        <NavLink to="/superadmin/users" className={navLinkClasses}>
          <UsersIcon className="w-4 h-4 mr-3" />
          User Management
        </NavLink>
        <NavLink to="/superadmin/finance" className={navLinkClasses}>
          <FinanceIcon className="w-4 h-4 mr-3" />
          Finance & ERP
        </NavLink>
        <NavLink to="/superadmin/analytics" className={navLinkClasses}>
          <ReportsIcon className="w-4 h-4 mr-3" />
          Analytics
        </NavLink>
        <NavLink to="/superadmin/infrastructure" className={navLinkClasses}>
          <BusIcon className="w-4 h-4 mr-3" />
          Infrastructure
        </NavLink>
        <NavLink to="/superadmin/communication" className={navLinkClasses}>
          <CommunicationIcon className="w-4 h-4 mr-3" />
          Communication
        </NavLink>
        <NavLink to="/superadmin/master-config" className={navLinkClasses}>
          <FileCogIcon className="w-4 h-4 mr-3" />
          Master Config
        </NavLink>
        <NavLink to="/superadmin/system" className={navLinkClasses}>
          <ShieldCheckIcon className="w-4 h-4 mr-3" />
          System & Audit
        </NavLink>
      </nav>
      <div className="mt-auto">
        <button
          onClick={onOpenProfile}
          className="w-full text-left px-4 py-3 mb-2 border-t border-slate-700 hover:bg-slate-700 rounded-lg transition-colors focus:outline-none"
        >
          <p className="text-sm font-semibold text-white truncate">
            {user?.name}
          </p>
          <p className="text-xs text-slate-400">{user?.role}</p>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-300 hover:bg-red-800 hover:text-white rounded-lg transition-colors duration-200"
        >
          <LogoutIcon className="w-4 h-4 mr-3" />
          <span>Logout</span>
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
      <div className="hidden lg:flex lg:flex-shrink-0">
        <SuperAdminSidebarContent
          onOpenProfile={() => setProfileModalOpen(true)}
        />
      </div>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 flex lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-black bg-opacity-25"
            aria-hidden="true"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full">
            <SuperAdminSidebarContent
              onClose={() => setIsSidebarOpen(false)}
              onOpenProfile={() => {
                setIsSidebarOpen(false);
                setProfileModalOpen(true);
              }}
            />
          </div>
        </div>
      )}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <button
          className="lg:hidden mb-4 text-text-secondary-dark"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? (
            <XIcon className="w-6 h-6" />
          ) : (
            <MenuIcon className="w-6 h-6" />
          )}
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
          <Route path="master-config" element={<MasterConfiguration />} />
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

export default SuperAdminPortal;
