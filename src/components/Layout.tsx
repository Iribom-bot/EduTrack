import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  BookOpen, 
  GraduationCap, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  School as SchoolIcon,
  FileSpreadsheet
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Layout: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'school_admin', 'teacher', 'student'] },
    { name: 'Schools', path: '/super/schools', icon: SchoolIcon, roles: ['super_admin'] },
    { name: 'Teachers', path: '/admin/teachers', icon: UserSquare2, roles: ['school_admin'] },
    { name: 'Students', path: '/admin/students', icon: Users, roles: ['school_admin'] },
    { name: 'Classes', path: '/admin/classes', icon: GraduationCap, roles: ['school_admin'] },
    { name: 'Subjects', path: '/admin/subjects', icon: BookOpen, roles: ['school_admin'] },
    { name: 'Academic Setup', path: '/admin/academic-setup', icon: Settings, roles: ['school_admin'] },
    { name: 'School Branding', path: '/admin/branding', icon: SchoolIcon, roles: ['school_admin'] },
    { name: 'Enter Scores', path: '/teacher/scores', icon: FileSpreadsheet, roles: ['teacher'] },
  ];

  const filteredNavItems = navItems.filter(item => profile && item.roles.includes(profile.role));

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen ? (
            <span className="text-xl font-bold text-indigo-600 tracking-tight">EduTrack</span>
          ) : (
            <span className="text-xl font-bold text-indigo-600">ET</span>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 rounded-md hover:bg-gray-100 lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center p-3 rounded-xl transition-colors group",
                location.pathname === item.path 
                  ? "bg-indigo-50 text-indigo-600" 
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon size={20} className={cn(
                "min-w-[20px]",
                location.pathname === item.path ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
              )} />
              {isSidebarOpen && <span className="ml-3 font-medium">{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center w-full p-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors group"
            )}
          >
            <LogOut size={20} className="min-w-[20px] text-gray-400 group-hover:text-red-600" />
            {isSidebarOpen && <span className="ml-3 font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 rounded-md hover:bg-gray-100 mr-4"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">
              {filteredNavItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{profile?.fullName}</p>
              <p className="text-xs text-gray-500 capitalize">{profile?.role.replace('_', ' ')}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              {profile?.fullName.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
