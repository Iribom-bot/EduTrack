import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { 
  Users, 
  UserSquare2, 
  GraduationCap, 
  BookOpen, 
  Plus,
  Calendar,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SchoolAdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    subjects: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.schoolId) return;

      try {
        const schoolId = profile.schoolId;
        
        const [studentsSnap, teachersSnap, classesSnap, subjectsSnap] = await Promise.all([
          getDocs(query(collection(db, `schools/${schoolId}/students`))),
          getDocs(query(collection(db, `schools/${schoolId}/teachers`))),
          getDocs(query(collection(db, `schools/${schoolId}/classes`))),
          getDocs(query(collection(db, `schools/${schoolId}/subjects`))),
        ]);

        setStats({
          students: studentsSnap.size,
          teachers: teachersSnap.size,
          classes: classesSnap.size,
          subjects: subjectsSnap.size,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile]);

  const statCards = [
    { name: 'Total Students', value: stats.students, icon: Users, color: 'bg-blue-500', link: '/admin/students' },
    { name: 'Total Teachers', value: stats.teachers, icon: UserSquare2, color: 'bg-indigo-500', link: '/admin/teachers' },
    { name: 'Total Classes', value: stats.classes, icon: GraduationCap, color: 'bg-emerald-500', link: '/admin/classes' },
    { name: 'Total Subjects', value: stats.subjects, icon: BookOpen, color: 'bg-amber-500', link: '/admin/subjects' },
  ];

  const chartData = [
    { name: 'Students', count: stats.students },
    { name: 'Teachers', count: stats.teachers },
    { name: 'Classes', count: stats.classes },
    { name: 'Subjects', count: stats.subjects },
  ];

  const COLORS = ['#3B82F6', '#6366F1', '#10B981', '#F59E0B'];

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}
      </div>
      <div className="h-64 bg-gray-200 rounded-2xl"></div>
    </div>;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.fullName}!</h2>
          <p className="text-gray-500">Here's what's happening in your school today.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/admin/academic-setup" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all">
            <Calendar size={18} className="mr-2 text-gray-400" />
            Academic Setup
          </Link>
          <Link to="/admin/students" className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all">
            <Plus size={18} className="mr-2" />
            Add Student
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link 
            key={card.name} 
            to={card.link}
            className="bg-white overflow-hidden rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-xl ${card.color} text-white shadow-lg shadow-${card.color.split('-')[1]}-200`}>
                  <card.icon size={24} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{card.name}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                    </dd>
                  </dl>
                </div>
                <ArrowUpRight size={20} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <TrendingUp size={20} className="mr-2 text-indigo-500" />
              School Overview
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
          <div className="space-y-4">
            <Link to="/admin/teachers" className="flex items-center p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mr-4">
                <UserSquare2 size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Manage Teachers</p>
                <p className="text-xs text-gray-500">Assign classes and subjects</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-500" />
            </Link>
            <Link to="/admin/classes" className="flex items-center p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mr-4">
                <GraduationCap size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Class Management</p>
                <p className="text-xs text-gray-500">Create and organize arms</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-500" />
            </Link>
            <Link to="/admin/subjects" className="flex items-center p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 mr-4">
                <BookOpen size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Subject List</p>
                <p className="text-xs text-gray-500">Configure academic subjects</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChevronRight = ({ size, className }: { size: number, className: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export default SchoolAdminDashboard;
