import React from 'react';
// FIX: Use the standard named import for createRoot
import { createRoot } from 'react-dom/client';
// FIX: Import createHashRouter and RouterProvider for react-router-dom v6.4+ data router setup.
import { createHashRouter, RouterProvider } from 'react-router-dom';

// FIX: Import all necessary page and layout components from App.tsx.
import {
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
  LibrarianPortal
} from './App.tsx';

// FIX: Define routes using the modern createHashRouter API.
const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <RootRedirector /> },
      { path: 'landing', element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'terms', element: <TermsAndConditionsPage /> },
      { path: 'refund', element: <RefundPolicyPage /> },
      { path: 'privacy', element: <PrivacyPolicyPage /> },
      { path: 'superadmin/*', element: <ProtectedRoute roles={['SuperAdmin']}><SuperAdminPortal /></ProtectedRoute> },
      { path: 'admin/*', element: <ProtectedRoute roles={['Admin']}><AdminPortal /></ProtectedRoute> },
      { path: 'principal/*', element: <ProtectedRoute roles={['Principal']}><PrincipalPortal /></ProtectedRoute> },
      { path: 'registrar/*', element: <ProtectedRoute roles={['Registrar']}><RegistrarPortal /></ProtectedRoute> },
      { path: 'teacher/*', element: <ProtectedRoute roles={['Teacher']}><TeacherPortal /></ProtectedRoute> },
      { path: 'student/*', element: <ProtectedRoute roles={['Student']}><StudentPortal /></ProtectedRoute> },
      { path: 'parent/*', element: <ProtectedRoute roles={['Parent']}><ParentPortal /></ProtectedRoute> },
      { path: 'librarian/*', element: <ProtectedRoute roles={['Librarian']}><LibrarianPortal /></ProtectedRoute> },
      { path: '*', element: <RootRedirector /> }
    ]
  }
]);


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// FIX: Use the createRoot function directly
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* FIX: Use RouterProvider to provide the router configuration to the app. */}
    <RouterProvider router={router} />
  </React.StrictMode>
);