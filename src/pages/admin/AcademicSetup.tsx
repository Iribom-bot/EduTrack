import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Calendar, Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Session, Term } from '../../types';

const AcademicSetup: React.FC = () => {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newSessionName, setNewSessionName] = useState('');

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!profile?.schoolId) return;
    setLoading(true);
    try {
      const schoolId = profile.schoolId;
      const sessionsSnap = await getDocs(collection(db, `schools/${schoolId}/sessions`));
      const sessionsData = sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
      setSessions(sessionsData);

      // Fetch terms for all sessions
      const allTerms: Term[] = [];
      for (const session of sessionsData) {
        const termsSnap = await getDocs(collection(db, `schools/${schoolId}/sessions/${session.id}/terms`));
        allTerms.push(...termsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Term)));
      }
      setTerms(allTerms);
    } catch (error) {
      console.error("Error fetching academic data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.schoolId || !newSessionName) return;

    try {
      const schoolId = profile.schoolId;
      const sessionRef = await addDoc(collection(db, `schools/${schoolId}/sessions`), {
        name: newSessionName,
        isActive: false,
        schoolId,
      });

      // Automatically add 3 terms for the new session
      const batch = writeBatch(db);
      const termNames = ['First Term', 'Second Term', 'Third Term'];
      termNames.forEach(name => {
        const termRef = doc(collection(db, `schools/${schoolId}/sessions/${sessionRef.id}/terms`));
        batch.set(termRef, {
          name,
          isActive: false,
          sessionId: sessionRef.id,
          schoolId,
        });
      });

      await batch.commit();
      setNewSessionName('');
      fetchData();
    } catch (error) {
      console.error("Error adding session:", error);
    }
  };

  const activateSession = async (sessionId: string) => {
    if (!profile?.schoolId) return;
    try {
      const batch = writeBatch(db);
      const schoolId = profile.schoolId;

      // Deactivate all sessions
      sessions.forEach(s => {
        batch.update(doc(db, `schools/${schoolId}/sessions`, s.id), { isActive: false });
      });

      // Activate target session
      batch.update(doc(db, `schools/${schoolId}/sessions`, sessionId), { isActive: true });

      await batch.commit();
      fetchData();
    } catch (error) {
      console.error("Error activating session:", error);
    }
  };

  const activateTerm = async (sessionId: string, termId: string) => {
    if (!profile?.schoolId) return;
    try {
      const batch = writeBatch(db);
      const schoolId = profile.schoolId;

      // Deactivate all terms in this session
      const sessionTerms = terms.filter(t => t.sessionId === sessionId);
      sessionTerms.forEach(t => {
        batch.update(doc(db, `schools/${schoolId}/sessions/${sessionId}/terms`, t.id), { isActive: false });
      });

      // Activate target term
      batch.update(doc(db, `schools/${schoolId}/sessions/${sessionId}/terms`, termId), { isActive: true });

      await batch.commit();
      fetchData();
    } catch (error) {
      console.error("Error activating term:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Academic Setup</h2>
        <p className="text-gray-500">Manage academic sessions and terms.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Add New Session</h3>
        <form onSubmit={handleAddSession} className="flex gap-4">
          <input
            type="text"
            placeholder="e.g., 2024/2025"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-all flex items-center">
            <Plus size={18} className="mr-2" /> Add Session
          </button>
        </form>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading academic data...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No sessions created yet.</div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className={`bg-white rounded-2xl border ${session.isActive ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-gray-100'} shadow-sm overflow-hidden`}>
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-3 rounded-xl ${session.isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'} mr-4`}>
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{session.name} Session</h4>
                    <p className="text-sm text-gray-500">{session.isActive ? 'Current Active Session' : 'Inactive Session'}</p>
                  </div>
                </div>
                {!session.isActive && (
                  <button 
                    onClick={() => activateSession(session.id)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg"
                  >
                    Activate Session
                  </button>
                )}
              </div>
              
              <div className="p-6 bg-gray-50/50">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Terms</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {terms.filter(t => t.sessionId === session.id).map((term) => (
                    <div 
                      key={term.id} 
                      className={`p-4 rounded-xl border ${term.isActive ? 'bg-white border-indigo-200 shadow-sm' : 'bg-white border-gray-200'} flex items-center justify-between`}
                    >
                      <div className="flex items-center">
                        {term.isActive ? (
                          <CheckCircle2 size={20} className="text-emerald-500 mr-3" />
                        ) : (
                          <XCircle size={20} className="text-gray-300 mr-3" />
                        )}
                        <span className={`font-medium ${term.isActive ? 'text-gray-900' : 'text-gray-500'}`}>{term.name}</span>
                      </div>
                      {session.isActive && !term.isActive && (
                        <button 
                          onClick={() => activateTerm(session.id, term.id)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AcademicSetup;
