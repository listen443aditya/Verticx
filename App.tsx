// App.tsx
import React from 'react';
// FIX: Changed react-router-dom imports to align with v6.4+ data router patterns.
// Outlet is used to render child routes, and useNavigate is used for programmatic navigation.
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { useAuth } from './hooks/useAuth.ts';
import type { UserRole } from './types.ts';
import { DataRefreshProvider } from './contexts/DataRefreshContext.tsx';

// Eager load pages to fix module resolution issues
import LandingPage from './pages/LandingPage.tsx';
import LoginPage from './pages/Login.tsx';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage.tsx';
import RefundPolicyPage from './pages/RefundPolicyPage.tsx';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.tsx';
import AdminPortal from './pages/admin/AdminPortal.tsx';
import SuperAdminPortal from './pages/superadmin/SuperAdminPortal.tsx';
import PrincipalPortal from './pages/principal/PrincipalPortal.tsx';
import RegistrarPortal from './pages/registrar/RegistrarPortal.tsx';
import TeacherPortal from './pages/teacher/TeacherPortal.tsx';
import StudentPortal from './pages/student/StudentPortal.tsx';
import ParentPortal from './pages/parent/ParentPortal.tsx';
import LibrarianPortal from './pages/librarian/LibrarianPortal.tsx';


// FIX: Rewritten ProtectedRoute to work with react-router-dom v6.4+.
// It now checks for authentication and authorization, redirecting if necessary.
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles: UserRole[] }> = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// FIX: This component handles the initial redirection logic based on user authentication status.
const RootRedirector: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-background-dark text-white">Initializing Verticx...</div>;
    }
    
    if (user) {
        switch (user.role) {
            case 'SuperAdmin': return <Navigate to="/superadmin/dashboard" replace />;
            case 'Admin': return <Navigate to="/admin/dashboard" replace />;
            case 'Principal': return <Navigate to="/principal/dashboard" replace />;
            case 'Registrar': return <Navigate to="/registrar/dashboard" replace />;
            case 'Teacher': return <Navigate to="/teacher/dashboard" replace />;
            case 'Student': return <Navigate to="/student/dashboard" replace />;
            case 'Parent': return <Navigate to="/parent/dashboard" replace />;
            case 'Librarian': return <Navigate to="/librarian/dashboard" replace />;
            default: return <Navigate to="/login" replace />;
        }
    }

    return <Navigate to="/landing" replace />;
};


// FIX: The main App component is now the root layout, providing context and rendering routes via <Outlet />.
const AppContent: React.FC = () => {
    return <Outlet />;
};

// FIX: Encapsulate the providers and the main App content.
const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataRefreshProvider>
        <AppContent />
      </DataRefreshProvider>
    </AuthProvider>
  );
};

// FIX: Export the individual components needed for the router configuration in index.tsx.
export {
    App,
    RootRedirector,
    ProtectedRoute,
    LandingPage,
    LoginPage,
    TermsAndConditionsPage,
    RefundPolicyPage,
    PrivacyPolicyPage,
    SuperAdminPortal,
    AdminPortal,
    PrincipalPortal,
    RegistrarPortal,
    TeacherPortal,
    StudentPortal,
    ParentPortal,
    LibrarianPortal,
};
export default App;