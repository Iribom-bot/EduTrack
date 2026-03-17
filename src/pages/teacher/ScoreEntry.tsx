import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { Save, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Student, Result, Session, Term, Subject, Class } from '../../types';

const ScoreEntry: React.FC = () => {
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');
  const subjectId = searchParams.get('subjectId');
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<Record<string, Partial<Result>>>({});
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [activeTerm, setActiveTerm] = useState<Term | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [cls, setCls] = useState<Class | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.schoolId || !classId || !subjectId) return;

      try {
        const schoolId = profile.schoolId;

        // 1. Fetch Active Session and Term
        const sessionsSnap = await getDocs(query(collection(db, `schools/${schoolId}/sessions`), where('isActive', '==', true)));
        if (sessionsSnap.empty) {
          setMessage({ text: 'No active session found. Please contact admin.', type: 'error' });
          setLoading(false);
          return;
        }
        const session = { id: sessionsSnap.docs[0].id, ...sessionsSnap.docs[0].data() } as Session;
        setActiveSession(session);

        const termsSnap = await getDocs(query(collection(db, `schools/${schoolId}/sessions/${session.id}/terms`), where('isActive', '==', true)));
        if (termsSnap.empty) {
          setMessage({ text: 'No active term found. Please contact admin.', type: 'error' });
          setLoading(false);
          return;
        }
        const term = { id: termsSnap.docs[0].id, ...termsSnap.docs[0].data() } as Term;
        setActiveTerm(term);

        // 2. Fetch Subject and Class details
        const [subSnap, clsSnap] = await Promise.all([
          getDoc(doc(db, `schools/${schoolId}/subjects`, subjectId)),
          getDoc(doc(db, `schools/${schoolId}/classes`, classId))
        ]);
        setSubject({ id: subSnap.id, ...subSnap.data() } as Subject);
        setCls({ id: clsSnap.id, ...clsSnap.data() } as Class);

        // 3. Fetch Students in this class
        const studentsSnap = await getDocs(query(collection(db, `schools/${schoolId}/students`), where('classId', '==', classId)));
        const studentsData = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        setStudents(studentsData);

        // 4. Fetch Existing Results
        const resultsSnap = await getDocs(query(
          collection(db, `schools/${schoolId}/results`),
          where('subjectId', '==', subjectId),
          where('classId', '==', classId),
          where('sessionId', '==', session.id),
          where('termId', '==', term.id)
        ));

        const resultsMap: Record<string, Partial<Result>> = {};
        resultsSnap.docs.forEach(doc => {
          const data = doc.data() as Result;
          resultsMap[data.studentId] = { ...data, id: doc.id };
        });
        setResults(resultsMap);

      } catch (error) {
        console.error("Error fetching score entry data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile, classId, subjectId]);

  const calculateGrade = (total: number) => {
    if (total >= 70) return 'A';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C';
    if (total >= 45) return 'D';
    if (total >= 40) return 'E';
    return 'F';
  };

  const handleScoreChange = (studentId: string, field: 'ca1' | 'ca2' | 'exam', value: string) => {
    const numValue = Math.min(
      field === 'exam' ? 60 : 20, 
      Math.max(0, parseInt(value) || 0)
    );

    setResults(prev => {
      const current = prev[studentId] || { ca1: 0, ca2: 0, exam: 0 };
      const updated = { ...current, [field]: numValue };
      const total = (updated.ca1 || 0) + (updated.ca2 || 0) + (updated.exam || 0);
      return {
        ...prev,
        [studentId]: {
          ...updated,
          total,
          grade: calculateGrade(total)
        }
      };
    });
  };

  const handleSave = async () => {
    if (!profile?.schoolId || !activeSession || !activeTerm || !classId || !subjectId) return;
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const schoolId = profile.schoolId;
      const promises = students.map(student => {
        const result = results[student.id];
        if (!result) return Promise.resolve();

        const resultId = result.id || `${student.id}_${subjectId}_${activeTerm.id}`;
        return setDoc(doc(db, `schools/${schoolId}/results`, resultId), {
          ...result,
          studentId: student.id,
          subjectId,
          classId,
          sessionId: activeSession.id,
          termId: activeTerm.id,
          schoolId,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      });

      await Promise.all(promises);
      setMessage({ text: 'Scores saved successfully!', type: 'success' });
    } catch (error) {
      console.error("Error saving scores:", error);
      setMessage({ text: 'Failed to save scores. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{subject?.name} - {cls?.name}</h2>
            <p className="text-sm text-gray-500">{activeSession?.name} • {activeTerm?.name}</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50"
        >
          <Save size={18} className="mr-2" />
          {saving ? 'Saving...' : 'Save All Scores'}
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {message.type === 'success' ? <CheckCircle2 size={20} className="mr-2" /> : <AlertCircle size={20} className="mr-2" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">CA1 (20)</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">CA2 (20)</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Exam (60)</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Total (100)</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Grade</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => {
                const result = results[student.id] || { ca1: 0, ca2: 0, exam: 0, total: 0, grade: 'F' };
                return (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{student.fullName}</div>
                      <div className="text-xs text-gray-500">{student.admissionNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={result.ca1 || 0}
                        onChange={(e) => handleScoreChange(student.id, 'ca1', e.target.value)}
                        className="w-16 text-center border border-gray-200 rounded-lg py-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={result.ca2 || 0}
                        onChange={(e) => handleScoreChange(student.id, 'ca2', e.target.value)}
                        className="w-16 text-center border border-gray-200 rounded-lg py-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={result.exam || 0}
                        onChange={(e) => handleScoreChange(student.id, 'exam', e.target.value)}
                        className="w-16 text-center border border-gray-200 rounded-lg py-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-gray-900">
                      {result.total || 0}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScoreEntry;
