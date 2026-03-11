import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useTheme } from './store/useTheme';
import Layout from './components/layout/Layout';
import MaintenanceNotice from './components/layout/MaintenanceNotice';
import CommandPalette from './components/ui/CommandPalette';
import ErrorBoundary from './components/common/ErrorBoundary';
import Login from './pages/Login';
import Home from './pages/Home';
import RequireVerification from './components/auth/RequireVerification';

// Code-split only secondary pages — entry pages must load instantly
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const VerifyEmailChangePage = lazy(() => import('./pages/VerifyEmailChangePage'));
const Profile = lazy(() => import('./pages/Profile'));
const Whiteboard = lazy(() => import('./components/tools/Whiteboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectSettings = lazy(() => import('./components/projects/ProjectSettingsDashboard'));
const Tasks = lazy(() => import('./pages/Tasks'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SecurityFeed = lazy(() => import('./pages/SecurityFeed'));

import { GlobalLoadingScreen, PageLoader } from './components/ui/Loading';

// Protected Route Wrapper Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) return <GlobalLoadingScreen />; 

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Wrapper specifically for the whiteboard to pass down the URL parameter as roomId
const WhiteboardWrapper = () => {
  const { roomId } = useParams();
  return <Whiteboard roomId={roomId} />;
};

// Initialize theme immediately so there's no flash of green on reload
useTheme.getState().initTheme();

function App() {
  const { checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return <GlobalLoadingScreen />;
  }

  return (
    <Router>
      <CommandPalette />
      <MaintenanceNotice />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Native Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/verify-email" element={<Suspense fallback={<PageLoader />}><VerifyEmail /></Suspense>} />
          <Route path="/verify-email-change/:token" element={<Suspense fallback={<PageLoader />}><VerifyEmailChangePage /></Suspense>} />

          {/* Secure Layout Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RequireVerification>
                  <ErrorBoundary>
                    <Layout />
                  </ErrorBoundary>
                </RequireVerification>
              </ProtectedRoute>
            }
          >
            {/* Suspense inside layout so the shell renders instantly */}
            <Route index element={<Home />} />
            <Route path="projects" element={<Suspense fallback={<PageLoader />}><Projects /></Suspense>} />
            <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
            <Route path="projects/:id/settings" element={<Suspense fallback={<PageLoader />}><ProjectSettings /></Suspense>} />
            <Route path="tasks" element={<Suspense fallback={<PageLoader />}><Tasks /></Suspense>} />
            <Route path="admin" element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
            <Route path="admin/security" element={<Suspense fallback={<PageLoader />}><SecurityFeed /></Suspense>} />

            <Route path="whiteboard/:roomId" element={<Suspense fallback={<PageLoader />}><WhiteboardWrapper /></Suspense>} />
          </Route>

          {/* Catch all unmatched routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
