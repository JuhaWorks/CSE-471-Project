import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useAuthStore } from './store/useAuthStore';
import Layout from './components/Layout';
import CommandPalette from './components/ui/CommandPalette';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Home from './pages/Home';
import RequireVerification from './components/RequireVerification';

// Code-split only secondary pages — entry pages must load instantly
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const Profile = lazy(() => import('./pages/Profile'));
const Whiteboard = lazy(() => import('./components/Whiteboard'));
const Settings = lazy(() => import('./pages/Settings'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Sleek, zero-lag loading fallback for code-split chunks
const PageLoader = () => (
  <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
    <div className="relative flex items-center justify-center">
      <div className="absolute w-12 h-12 border-4 border-violet-500/20 rounded-full animate-ping shadow-[0_0_15px_rgba(139,92,246,0.3)]"></div>
      <div className="w-10 h-10 border-4 border-transparent border-t-violet-500 border-b-blue-500 rounded-full animate-spin"></div>
    </div>
  </div>
);

// Protected Route Wrapper Component
const ProtectedRoute = ({ children }) => {
  const { user, authChecking } = useAuthStore();

  if (authChecking) return null; // Still verifying session cookie

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Wrapper specifically for the whiteboard to pass down the URL parameter as roomId
const WhiteboardWrapper = () => {
  const { roomId } = useParams();
  return <Whiteboard roomId={roomId} />;
};

function App() {
  const { checkAuth, authChecking } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <CommandPalette />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Native Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/verify-email" element={<Suspense fallback={<PageLoader />}><VerifyEmail /></Suspense>} />

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
            <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
            <Route path="admin" element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
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
