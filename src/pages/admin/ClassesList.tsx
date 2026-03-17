import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { GraduationCap, Plus, Trash2, Edit2, X } from 'lucide-react';
import { Class } from '../../types';

const ClassesList: React.FC = () => {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  
  const [formData, setFormData] = useState({
    level: 'Primary' as any,
    name: '',
    arm: '',
  });

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!profile?.schoolId) return;
    setLoading(true);
    try {
      const schoolId = profile.schoolId;
      const snap = await getDocs(collection(db, `schools/${schoolId}/classes`));
      setClasses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class)));
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.schoolId) return;

    try {
      if (editingClass) {
        await updateDoc(doc(db, `schools/${profile.schoolId}/classes`, editingClass.id), formData);
      } else {
        await addDoc(collection(db, `schools/${profile.schoolId}/classes`), {
          ...formData,
          schoolId: profile.schoolId,
        });
      }
      setIsModalOpen(false);
      setEditingClass(null);
      setFormData({ level: 'Primary', name: '', arm: '' });
      fetchData();
    } catch (error) {
      console.error("Error saving class:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!profile?.schoolId || !window.confirm('Are you sure?')) return;
    try {
      await deleteDoc(doc(db, `schools/${profile.schoolId}/classes`, id));
      fetchData();
    } catch (error) {
      console.error("Error deleting class:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Management</h2>
          <p className="text-gray-500">Organize your school's classes and arms.</p>
        </div>
        <button 
          onClick={() => {
            setEditingClass(null);
            setFormData({ level: 'Primary', name: '', arm: '' });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
        >
          <Plus size={18} className="mr-2" />
          Create Class
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">Loading classes...</div>
        ) : classes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">No classes created yet.</div>
        ) : (
          classes.map((cls) => (
            <div key={cls.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                  <GraduationCap size={24} />
                </div>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => {
                    setEditingClass(cls);
                    setFormData({ level: cls.level, name: cls.name, arm: cls.arm });
                    setIsModalOpen(true);
                  }} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(cls.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{cls.name}</h3>
              <p className="text-sm text-gray-500 mb-2">Arm: <span className="font-medium text-gray-700">{cls.arm}</span></p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {cls.level}
              </span>
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
                <h3 className="text-lg font-bold text-gray-900">{editingClass ? 'Edit Class' : 'Create New Class'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                    className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="Nursery">Nursery</option>
                    <option value="Primary">Primary</option>
                    <option value="Junior Secondary">Junior Secondary</option>
                    <option value="Senior Secondary">Senior Secondary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Class Name (e.g., Primary 5)</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Arm (e.g., A, B, Gold)</label>
                  <input
                    type="text"
                    required
                    value={formData.arm}
                    onChange={(e) => setFormData({ ...formData, arm: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all">
                    {editingClass ? 'Update' : 'Create'}
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

export default ClassesList;
