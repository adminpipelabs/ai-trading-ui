// Main App - Pipe Labs AI Trading Platform
// This is a complete, self-contained application

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import PipeLabsApp from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import Login from './pages/Login';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './styles/globals.css';

// AdminDashboard wrapper that uses AuthContext instead of its own user state
function AdminDashboardWrapper() {
  const { user, logout } = useAuth();
  
  // PipeLabsApp expects user and onLogout props
  // But it also has its own user state management, so we need to handle this differently
  // For now, let's use the existing PipeLabsApp but ensure it gets the right user
  return <PipeLabsApp />;
}

// Protected route wrapper
function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ color: '#6b7280' }}>Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && user.role !== 'admin') {
    // Non-admin trying to access admin route - redirect to client dashboard
    return <Navigate to="/" replace />;
  }
  
  return children;
}

// Main app router
function AppRouter() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ color: '#6b7280' }}>Loading...</div>
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminDashboardWrapper />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/*" 
        element={
          <ProtectedRoute>
            {/* CRITICAL SECURITY: Only route to admin if role is EXPLICITLY 'admin' */}
            {/* Default to ClientDashboard for safety */}
            {user?.role === 'admin' ? <AdminDashboardWrapper /> : <ClientDashboard />}
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary title="Application Error" message="The application encountered an error. Please refresh the page or contact support if the issue persists.">
      <HashRouter>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
