import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import RegisterSchool from './pages/RegisterSchool';
import Dashboard from './pages/Dashboard';
import SchoolAdminDashboard from './pages/admin/SchoolAdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import SuperAdminDashboard from './pages/super/SuperAdminDashboard';
import TeachersList from './pages/admin/TeachersList';
import StudentsList from './pages/admin/StudentsList';
import ClassesList from './pages/admin/ClassesList';
import SubjectsList from './pages/admin/SubjectsList';
import AcademicSetup from './pages/admin/AcademicSetup';
import SchoolBranding from './pages/admin/SchoolBranding';
import ScoreEntry from './pages/teacher/ScoreEntry';
import Layout from './components/Layout';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, profile, loading, isAuthReady } = useAuth();

  if (!isAuthReady || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register-school" element={<RegisterSchool />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* School Admin Routes */}
            <Route path="admin/teachers" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']}><TeachersList /></ProtectedRoute>} />
            <Route path="admin/students" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']}><StudentsList /></ProtectedRoute>} />
            <Route path="admin/classes" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']}><ClassesList /></ProtectedRoute>} />
            <Route path="admin/subjects" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']}><SubjectsList /></ProtectedRoute>} />
            <Route path="admin/academic-setup" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']}><AcademicSetup /></ProtectedRoute>} />
            <Route path="admin/branding" element={<ProtectedRoute allowedRoles={['school_admin']}><SchoolBranding /></ProtectedRoute>} />
            
            {/* Teacher Routes */}
            <Route path="teacher/scores" element={<ProtectedRoute allowedRoles={['teacher']}><ScoreEntry /></ProtectedRoute>} />
            
            {/* Super Admin Routes */}
            <Route path="super/schools" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
