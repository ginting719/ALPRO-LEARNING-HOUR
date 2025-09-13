
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
    <div className="min-h-screen bg-neutral-900 text-white font-sans">
        <div className="absolute inset-0 -z-10 h-full w-full bg-neutral-900 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute top-0 left-0 -z-10 h-full w-full bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-pink-500/20 blur-3xl animate-background-pan"></div>
      
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
