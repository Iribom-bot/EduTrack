import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { BookOpen, Plus, Trash2, Edit2, X } from 'lucide-react';
import { Subject } from '../../types';

const SubjectsList: React.FC = () => {
  const { profile } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
  });

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!profile?.schoolId) return;
    setLoading(true);
    try {
      const schoolId = profile.schoolId;
      const snap = await getDocs(collection(db, `schools/${schoolId}/subjects`));
      setSubjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)));
    } catch (error) {
      console.error("Error fetching subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.schoolId) return;

    try {
      if (editingSubject) {
        await updateDoc(doc(db, `schools/${profile.schoolId}/subjects`, editingSubject.id), formData);
      } else {
        await addDoc(collection(db, `schools/${profile.schoolId}/subjects`), {
          ...formData,
          schoolId: profile.schoolId,
        });
      }
      setIsModalOpen(false);
      setEditingSubject(null);
      setFormData({ name: '', code: '' });
      fetchData();
    } catch (error) {
      console.error("Error saving subject:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!profile?.schoolId || !window.confirm('Are you sure?')) return;
    try {
      await deleteDoc(doc(db, `schools/${profile.schoolId}/subjects`, id));
      fetchData();
    } catch (error) {
      console.error("Error deleting subject:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subject Management</h2>
          <p className="text-gray-500">Manage academic subjects taught in your school.</p>
        </div>
        <button 
          onClick={() => {
            setEditingSubject(null);
            setFormData({ name: '', code: '' });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
        >
          <Plus size={18} className="mr-2" />
          Create Subject
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">Loading subjects...</div>
        ) : subjects.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">No subjects created yet.</div>
        ) : (
          subjects.map((sub) => (
            <div key={sub.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                  <BookOpen size={24} />
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => {
                    setEditingSubject(sub);
                    setFormData({ name: sub.name, code: sub.code || '' });
                    setIsModalOpen(true);
                  }} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(sub.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{sub.name}</h3>
              {sub.code && <p className="text-xs font-mono text-gray-400 mt-1 uppercase tracking-wider">{sub.code}</p>}
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 opacity-75"></div>
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">{editingSubject ? 'Edit Subject' : 'Create New Subject'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Mathematics"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., MATH101"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all">
                    {editingSubject ? 'Update' : 'Create'}
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectsList;
