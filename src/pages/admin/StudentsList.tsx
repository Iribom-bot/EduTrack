import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Users, Plus, Search, Trash2, Edit2, X, Upload, FileDown } from 'lucide-react';
import { Student, Class } from '../../types';

const StudentsList: React.FC = () => {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Male' as 'Male' | 'Female',
    classId: '',
    admissionNumber: '',
    parentName: '',
    parentPhone: '',
  });

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!profile?.schoolId) return;
    setLoading(true);
    try {
      const schoolId = profile.schoolId;
      const [studentsSnap, classesSnap] = await Promise.all([
        getDocs(collection(db, `schools/${schoolId}/students`)),
        getDocs(collection(db, `schools/${schoolId}/classes`)),
      ]);

      setStudents(studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
      setClasses(classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class)));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.schoolId) return;

    try {
      if (editingStudent) {
        await updateDoc(doc(db, `schools/${profile.schoolId}/students`, editingStudent.id), formData);
      } else {
        await addDoc(collection(db, `schools/${profile.schoolId}/students`), {
          ...formData,
          schoolId: profile.schoolId,
          createdAt: new Date().toISOString(),
        });
      }
      setIsModalOpen(false);
      setEditingStudent(null);
      setFormData({ fullName: '', gender: 'Male', classId: '', admissionNumber: '', parentName: '', parentPhone: '' });
      fetchData();
    } catch (error) {
      console.error("Error saving student:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!profile?.schoolId || !window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await deleteDoc(doc(db, `schools/${profile.schoolId}/students`, id));
      fetchData();
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.schoolId) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const batch = writeBatch(db);
      
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [fullName, gender, className, admissionNumber, parentPhone] = line.split(',');
        
        // Find class by name
        const targetClass = classes.find(c => c.name.toLowerCase() === className.toLowerCase().trim());
        
        if (targetClass) {
          const studentRef = doc(collection(db, `schools/${profile.schoolId}/students`));
          batch.set(studentRef, {
            fullName: fullName.trim(),
            gender: (gender.trim() === 'Female' ? 'Female' : 'Male'),
            classId: targetClass.id,
            admissionNumber: admissionNumber.trim(),
            parentPhone: parentPhone?.trim() || '',
            schoolId: profile.schoolId,
            createdAt: new Date().toISOString(),
          });
        }
      }
      
      try {
        await batch.commit();
        alert('Bulk upload successful!');
        fetchData();
      } catch (error) {
        console.error("Error in bulk upload:", error);
        alert('Bulk upload failed. Check your CSV format.');
      }
    };
    reader.readAsText(file);
  };

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Students Management</h2>
          <p className="text-gray-500">Manage student records and admissions.</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all">
            <Upload size={18} className="mr-2 text-gray-400" />
            Bulk Upload
            <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} />
          </label>
          <button 
            onClick={() => {
              setEditingStudent(null);
              setFormData({ fullName: '', gender: 'Male', classId: '', admissionNumber: '', parentName: '', parentPhone: '' });
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
          >
            <Plus size={18} className="mr-2" />
            Add Student
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search students by name or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <a 
            href="data:text/csv;charset=utf-8,Name,Gender,Class,Admission No,Parent Phone" 
            download="student_template.csv"
            className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center font-medium"
          >
            <FileDown size={16} className="mr-1" /> Download CSV Template
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Info</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading students...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No students found.</td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {student.fullName.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                          <div className="text-xs text-gray-500">{student.gender}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                      {student.admissionNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {classes.find(c => c.id === student.classId)?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.parentName || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{student.parentPhone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => {
                          setEditingStudent(student);
                          setFormData({
                            fullName: student.fullName,
                            gender: student.gender,
                            classId: student.classId,
                            admissionNumber: student.admissionNumber,
                            parentName: student.parentName || '',
                            parentPhone: student.parentPhone || '',
                          });
                          setIsModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Gender</label>
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Admission Number</label>
                        <input
                          type="text"
                          required
                          value={formData.admissionNumber}
                          onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Class</label>
                        <select
                          required
                          value={formData.classId}
                          onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="">Select a class</option>
                          {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.arm})</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Parent Name</label>
                        <input
                          type="text"
                          value={formData.parentName}
                          onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Parent Phone</label>
                        <input
                          type="text"
                          value={formData.parentPhone}
                          onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingStudent ? 'Update Student' : 'Save Student'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
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

export default StudentsList;
