import React from 'react';
import { useAuth } from '../context/AuthContext';
import SchoolAdminDashboard from './admin/SchoolAdminDashboard';
import TeacherDashboard from './teacher/TeacherDashboard';
import StudentDashboard from './student/StudentDashboard';
import SuperAdminDashboard from './super/SuperAdminDashboard';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();

  if (!profile) return null;

  switch (profile.role) {
    case 'super_admin':
      return <SuperAdminDashboard />;
    case 'school_admin':
      return <SchoolAdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
      return <StudentDashboard />;
    default:
      return <div>Unauthorized</div>;
  }
};

export default Dashboard;
