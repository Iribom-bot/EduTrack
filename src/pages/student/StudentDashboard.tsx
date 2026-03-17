import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { FileDown, GraduationCap, Calendar, BookOpen, Award } from 'lucide-react';
import { Student, Result, Session, Term, Subject, School, Class } from '../../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const StudentDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [results, setResults] = useState<(Result & { subjectName: string })[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [cls, setCls] = useState<Class | null>(null);
  
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!profile?.schoolId || profile.role !== 'student') return;

      try {
        const schoolId = profile.schoolId;
        
        // 1. Fetch Student Record
        const studentsSnap = await getDocs(query(
          collection(db, `schools/${schoolId}/students`),
          where('admissionNumber', '==', profile.admissionNumber)
        ));
        
        if (studentsSnap.empty) {
          setLoading(false);
          return;
        }
        const studentData = { id: studentsSnap.docs[0].id, ...studentsSnap.docs[0].data() } as Student;
        setStudent(studentData);

        // 2. Fetch School and Class
        const [schoolSnap, clsSnap] = await Promise.all([
          getDoc(doc(db, 'schools', schoolId)),
          getDoc(doc(db, `schools/${schoolId}/classes`, studentData.classId))
        ]);
        setSchool({ id: schoolSnap.id, ...schoolSnap.data() } as School);
        setCls({ id: clsSnap.id, ...clsSnap.data() } as Class);

        // 3. Fetch Sessions and Terms
        const sessionsSnap = await getDocs(collection(db, `schools/${schoolId}/sessions`));
        const sessionsData = sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Session));
        setSessions(sessionsData);

        const activeSession = sessionsData.find(s => s.isActive);
        if (activeSession) {
          setSelectedSession(activeSession.id);
          const termsSnap = await getDocs(collection(db, `schools/${schoolId}/sessions/${activeSession.id}/terms`));
          const termsData = termsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Term));
          setTerms(termsData);
          const activeTerm = termsData.find(t => t.isActive);
          if (activeTerm) setSelectedTerm(activeTerm.id);
        }

        // 4. Fetch Subjects
        const subjectsSnap = await getDocs(collection(db, `schools/${schoolId}/subjects`));
        setSubjects(subjectsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subject)));

      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [profile]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!student || !selectedSession || !selectedTerm || !profile?.schoolId) return;

      try {
        const resultsSnap = await getDocs(query(
          collection(db, `schools/${profile.schoolId}/results`),
          where('studentId', '==', student.id),
          where('sessionId', '==', selectedSession),
          where('termId', '==', selectedTerm)
        ));

        const subjectsMap = Object.fromEntries(subjects.map(s => [s.id, s.name]));
        const resultsData = resultsSnap.docs.map(doc => {
          const data = doc.data() as Result;
          return {
            ...data,
            id: doc.id,
            subjectName: subjectsMap[data.subjectId] || 'Unknown Subject'
          };
        });

        setResults(resultsData);
      } catch (error) {
        console.error("Error fetching results:", error);
      }
    };

    fetchResults();
  }, [student, selectedSession, selectedTerm, subjects, profile]);

  const generatePDF = () => {
    if (!student || !school || !cls) return;

    const doc = new jsPDF();
    const sessionName = sessions.find(s => s.id === selectedSession)?.name || '';
    const termName = terms.find(t => t.id === selectedTerm)?.name || '';

    // Header
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.text(school.name, 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(school.address || '', 105, 28, { align: 'center' });
    doc.text(`${sessionName} Session - ${termName}`, 105, 34, { align: 'center' });

    doc.setDrawColor(200);
    doc.line(20, 40, 190, 40);

    // Student Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Name: ${student.fullName}`, 20, 50);
    doc.text(`Admission No: ${student.admissionNumber}`, 20, 58);
    doc.text(`Class: ${cls.name} (${cls.arm})`, 130, 50);
    doc.text(`Gender: ${student.gender}`, 130, 58);

    // Results Table
    const tableData = results.map(r => [
      r.subjectName,
      r.ca1.toString(),
      r.ca2.toString(),
      r.exam.toString(),
      r.total.toString(),
      r.grade
    ]);

    (doc as any).autoTable({
      startY: 70,
      head: [['Subject', 'CA1', 'CA2', 'Exam', 'Total', 'Grade']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const totalScore = results.reduce((acc, r) => acc + r.total, 0);
    const average = results.length > 0 ? (totalScore / results.length).toFixed(2) : '0.00';

    doc.setFontSize(12);
    doc.text(`Total Score: ${totalScore}`, 20, finalY);
    doc.text(`Average Score: ${average}%`, 20, finalY + 8);

    // Footer
    doc.text('Class Teacher\'s Remark: ___________________________', 20, finalY + 25);
    doc.text('Principal\'s Remark: ___________________________', 20, finalY + 35);
    
    doc.save(`${student.fullName}_Result_${termName}.pdf`);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Academic Results</h2>
          <p className="text-gray-500">View and download your termly performance.</p>
        </div>
        <button 
          onClick={generatePDF}
          disabled={results.length === 0}
          className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50"
        >
          <FileDown size={18} className="mr-2" />
          Download Report Card
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Academic Session</label>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              value={selectedSession} 
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
            >
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Term</label>
          <div className="relative">
            <GraduationCap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              value={selectedTerm} 
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
            >
              <option value="">Select Term</option>
              {terms.filter(t => t.sessionId === selectedSession).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-4">
            <BookOpen size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No Results Found</h3>
          <p className="text-gray-500 max-w-xs mx-auto mt-2">
            Results for the selected session and term have not been published yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Results Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Grade</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{result.subjectName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-indigo-600">
                      {result.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        result.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                        result.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                        result.grade === 'C' ? 'bg-amber-100 text-amber-800' :
                        result.grade === 'F' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {result.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Card */}
          <div className="space-y-6">
            <div className="bg-indigo-600 p-8 rounded-2xl text-white shadow-lg shadow-indigo-200">
              <div className="flex items-center mb-6">
                <Award size={32} className="mr-3" />
                <h3 className="text-xl font-bold">Performance Summary</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-indigo-500 pb-4">
                  <span className="text-indigo-100">Total Score</span>
                  <span className="text-2xl font-bold">{results.reduce((acc, r) => acc + r.total, 0)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-indigo-500 pb-4">
                  <span className="text-indigo-100">Average</span>
                  <span className="text-2xl font-bold">
                    {(results.reduce((acc, r) => acc + r.total, 0) / results.length).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-100">Subjects Taken</span>
                  <span className="text-2xl font-bold">{results.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
