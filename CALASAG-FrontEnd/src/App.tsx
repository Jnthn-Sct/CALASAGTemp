import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Components/Pages/Dashboard';
import Messages from './Components/Pages/Messages';
import Report from './Components/Pages/Report';
import Login from './Components/Pages/Login';
import SuperAdminDashboard from './Components/Pages/SuperAdminDashboard';
import AdminDashboard from './Components/Pages/AdminDashboard';

// Protected Route component to handle role-based access
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const userRole = localStorage.getItem('userRole');

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Super Admin Routes */}
        <Route
          path="/super-admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* User Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin', 'user']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/messages" element={<Messages />} />
        <Route path="/report" element={<Report />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;