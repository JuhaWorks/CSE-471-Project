import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Home from './pages/Home';
import Layout from './components/Layout';
import Whiteboard from './components/Whiteboard';

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
      <Routes>
        {/* Public Native Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Secure Layout Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Nested routes inherit the Layout and Protection */}
          <Route index element={<Home />} />
          <Route path="profile" element={<Profile />} />
          <Route path="whiteboard/:roomId" element={<WhiteboardWrapper />} />
        </Route>

        {/* Catch all unmatched routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
