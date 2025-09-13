
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ModulesPage from './pages/ModulesPage';
import ModuleDetailPage from './pages/ModuleDetailPage';
import AdminModulesPage from './pages/AdminModulesPage';
import AdminModuleEditPage from './pages/AdminModuleEditPage';

const ProtectedRoute = ({ children, adminOnly }: { children: JSX.Element, adminOnly?: boolean }) => {
  const { user, profile } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (adminOnly && profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-black to-pink-900 text-white font-sans">
      
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/modules" element={<ProtectedRoute><ModulesPage /></ProtectedRoute>} />
            <Route path="/module/:id" element={<ProtectedRoute><ModuleDetailPage /></ProtectedRoute>} />
            <Route path="/admin/modules" element={<ProtectedRoute adminOnly={true}><AdminModulesPage /></ProtectedRoute>} />
            <Route path="/admin/module/new" element={<ProtectedRoute adminOnly={true}><AdminModuleEditPage /></ProtectedRoute>} />
            <Route path="/admin/module/edit/:id" element={<ProtectedRoute adminOnly={true}><AdminModuleEditPage /></ProtectedRoute>} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </div>
  );
};

export default App;
