import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { BookOpen, GraduationCap, FileSpreadsheet, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Assignment, Class, Subject } from '../../types';

const TeacherDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<(Assignment & { className: string, subjectName: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!profile?.schoolId || profile.role !== 'teacher') return;

      try {
        const schoolId = profile.schoolId;
        // Find teacher record to get their ID
        const teachersSnap = await getDocs(query(
          collection(db, `schools/${schoolId}/teachers`),
          where('userId', '==', profile.uid)
        ));
        
        let teacherId = '';
        if (!teachersSnap.empty) {
          teacherId = teachersSnap.docs[0].id;
        } else {
          // Fallback: search by name or email if userId not linked yet
          const allTeachers = await getDocs(collection(db, `schools/${schoolId}/teachers`));
          const match = allTeachers.docs.find(d => d.data().email === profile.email);
          if (match) teacherId = match.id;
        }

        if (!teacherId) {
          setLoading(false);
          return;
        }

        const assignmentsSnap = await getDocs(query(
          collection(db, `schools/${schoolId}/assignments`),
          where('teacherId', '==', teacherId)
        ));

        const classesSnap = await getDocs(collection(db, `schools/${schoolId}/classes`));
        const subjectsSnap = await getDocs(collection(db, `schools/${schoolId}/subjects`));

        const classesMap = Object.fromEntries(classesSnap.docs.map(d => [d.id, d.data().name + ' ' + d.data().arm]));
        const subjectsMap = Object.fromEntries(subjectsSnap.docs.map(d => [d.id, d.data().name]));

        const assignmentsData = assignmentsSnap.docs.map(doc => {
          const data = doc.data() as Assignment;
          return {
            ...data,
            id: doc.id,
            className: classesMap[data.classId] || 'Unknown Class',
            subjectName: subjectsMap[data.subjectId] || 'Unknown Subject',
          };
        });

        setAssignments(assignmentsData);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [profile]);

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-10 bg-gray-200 rounded-xl w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-200 rounded-2xl"></div>)}
      </div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h2>
        <p className="text-gray-500">Manage your assigned classes and subjects.</p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mx-auto mb-4">
            <BookOpen size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No Assignments Yet</h3>
          <p className="text-gray-500 max-w-xs mx-auto mt-2">
            You haven't been assigned to any classes or subjects yet. Please contact the school administrator.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                    <GraduationCap size={24} />
                  </div>
                  <Link 
                    to={`/teacher/scores?classId=${assignment.classId}&subjectId=${assignment.subjectId}`}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <FileSpreadsheet size={20} />
                  </Link>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{assignment.className}</h3>
                <p className="text-indigo-600 font-medium mt-1">{assignment.subjectName}</p>
                
                <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Academic Results</span>
                  <Link 
                    to={`/teacher/scores?classId=${assignment.classId}&subjectId=${assignment.subjectId}`}
                    className="text-sm font-bold text-indigo-600 flex items-center group-hover:translate-x-1 transition-transform"
                  >
                    Enter Scores <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
